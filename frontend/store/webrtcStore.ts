import { create } from 'zustand';
import { stompService } from '@/services/stompClient';
import { useModalStore } from './modalStore';

interface WebRTCState {
    localStream: MediaStream | null;
    remoteStreams: Record<string, MediaStream>; // keyed by userId
    peerConnections: Record<string, RTCPeerConnection>; // keyed by userId
    remoteVideoStates: Record<string, boolean>;
    remoteAudioStates: Record<string, boolean>;
    isAudioMuted: boolean;
    isVideoMuted: boolean;
    isScreenSharing: boolean;
    isRemoteScreenSharing: boolean;
    remoteScreenStreams: Record<string, MediaStream>;
    localScreenStream: MediaStream | null;
    setLocalStream: (stream: MediaStream) => void;
    addRemoteStream: (userId: string, stream: MediaStream) => void;
    removeRemoteStream: (userId: string) => void;
    toggleAudio: () => void;
    toggleVideo: () => Promise<void>;
    startScreenShare: (onStop?: () => void) => Promise<void>;
    stopScreenShare: () => Promise<void>;
    setRemoteScreenShare: (userId: string, isSharing: boolean) => void;
    addPeerConnection: (userId: string, pc: RTCPeerConnection) => void;
    removePeerConnection: (userId: string) => void;
    setRemoteVideoState: (userId: string, isMuted: boolean) => void;
    setRemoteAudioState: (userId: string, isMuted: boolean) => void;
    createPeerConnection: (targetUserId: string, isInitiator: boolean, roomId: string) => RTCPeerConnection;
    remoteScreenShareIntents: Record<string, boolean>;
}

const ICE_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export const useWebRTCStore = create<WebRTCState>((set, get) => ({
    localStream: null,
    remoteStreams: {},
    peerConnections: {},
    remoteVideoStates: {},
    remoteAudioStates: {},
    isAudioMuted: true,
    isVideoMuted: true,
    isScreenSharing: false,
    isRemoteScreenSharing: false,
    remoteScreenStreams: {},
    localScreenStream: null,
    remoteScreenShareIntents: {},

    setLocalStream: (stream) => set({ localStream: stream }),
    
    addRemoteStream: (userId, stream) => set((state) => {
        return {
            remoteStreams: { ...state.remoteStreams, [userId]: stream }
        };
    }),

    removeRemoteStream: (userId) => set((state) => {
        const newStreams = { ...state.remoteStreams };
        delete newStreams[userId];
        const newScreenStreams = { ...state.remoteScreenStreams };
        delete newScreenStreams[userId];
        return { remoteStreams: newStreams, remoteScreenStreams: newScreenStreams };
    }),

    addPeerConnection: (userId, pc) => set((state) => ({
        peerConnections: { ...state.peerConnections, [userId]: pc }
    })),

    removePeerConnection: (userId) => set((state) => {
        const newPCs = { ...state.peerConnections };
        const pc = newPCs[userId];
        if (pc) pc.close();
        delete newPCs[userId];
        return { peerConnections: newPCs };
    }),

    setRemoteVideoState: (userId, isMuted) => {
        set(state => ({
            remoteVideoStates: { ...state.remoteVideoStates, [userId]: isMuted }
        }));
    },
    setRemoteAudioState: (userId: string, isMuted: boolean) => {
        set(state => ({
            remoteAudioStates: { ...state.remoteAudioStates, [userId]: isMuted }
        }));
    },

    createPeerConnection: (targetUserId, isInitiator, roomId) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        const { localStream, addRemoteStream } = get();

        if (isInitiator) {
            const audioTrack = localStream?.getTracks().find(t => t.kind === 'audio');
            if (audioTrack) {
                pc.addTransceiver(audioTrack, { direction: 'sendrecv', streams: [localStream!] });
            } else {
                pc.addTransceiver('audio', { direction: 'sendrecv' });
            }

            const videoTrack = localStream?.getTracks().find(t => t.kind === 'video');
            if (videoTrack) {
                pc.addTransceiver(videoTrack, { direction: 'sendrecv', streams: [localStream!] });
            } else {
                pc.addTransceiver('video', { direction: 'sendrecv' });
            }

            const localScreenStream = get().localScreenStream;
            const screenTrack = localScreenStream?.getVideoTracks()[0];
            if (screenTrack) {
                pc.addTransceiver(screenTrack, { direction: 'sendrecv', streams: [localScreenStream!] });
            } else {
                pc.addTransceiver('video', { direction: 'sendrecv' });
            }
        }

        // Handle remote tracks — detect if it's a screen share (display surface)
        // Handle remote tracks — map based on transceiver index
        pc.ontrack = (event) => {
            const transceivers = pc.getTransceivers();
            const index = transceivers.indexOf(event.transceiver);
            
            // Ignore event.streams to prevent browser from accidentally grouping screen share with camera
            if (index === 2) {
                const currentStream = get().remoteScreenStreams[targetUserId];
                const tracks = currentStream ? currentStream.getTracks() : [];
                if (!tracks.includes(event.track)) {
                    tracks.push(event.track);
                }
                // Create a NEW MediaStream instance so React updates the srcObject
                const newStream = new MediaStream(tracks);
                set((state) => ({ remoteScreenStreams: { ...state.remoteScreenStreams, [targetUserId]: newStream } }));
            } else {
                const currentStream = get().remoteStreams[targetUserId];
                const tracks = currentStream ? currentStream.getTracks() : [];
                if (!tracks.includes(event.track)) {
                    tracks.push(event.track);
                }
                // Create a NEW MediaStream instance so React updates the srcObject
                const newStream = new MediaStream(tracks);
                get().addRemoteStream(targetUserId, newStream);
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                stompService.publish('/app/webrtc.signal', {
                    targetUserId,
                    roomId,
                    type: 'ICE',
                    payload: event.candidate
                });
            }
        };

        // Handle negotiation needed
        pc.onnegotiationneeded = async () => {
            if (isInitiator) {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    stompService.publish('/app/webrtc.signal', {
                        targetUserId,
                        roomId,
                        type: 'OFFER',
                        payload: pc.localDescription
                    });
                } catch (err) {
                    console.error('Failed to create offer', err);
                }
            }
        };

        get().addPeerConnection(targetUserId, pc);
        return pc;
    },

    toggleAudio: async () => {
        const { localStream, isAudioMuted, peerConnections } = get();
        if (isAudioMuted) {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const newAudioTrack = newStream.getAudioTracks()[0];
                let updatedStream = newStream;
                if (localStream) {
                    updatedStream = new MediaStream([
                        ...localStream.getVideoTracks(),
                        newAudioTrack
                    ]);
                }
                const currentPCs = get().peerConnections;
                Object.values(currentPCs).forEach(pc => {
                    if (pc.signalingState === 'closed') return;
                    const transceiver = pc.getTransceivers()[0];
                    if (transceiver && transceiver.sender) {
                        transceiver.sender.replaceTrack(newAudioTrack).catch(e => console.warn(e));
                    }
                });
                set({ isAudioMuted: false, localStream: updatedStream });
            } catch (err) {
                console.warn("Failed to enable audio", err);
                setTimeout(() => {
                    useModalStore.getState().showAlert("Microphone Error", "Failed to access microphone. Please check your browser permissions.");
                }, 0);
            }
        } else {
            let updatedStream = localStream;
            if (localStream) {
                localStream.getAudioTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                });
                updatedStream = new MediaStream(localStream.getVideoTracks());
            }
            const currentPCs = get().peerConnections;
            Object.values(currentPCs).forEach(pc => {
                if (pc.signalingState === 'closed') return;
                const transceiver = pc.getTransceivers()[0];
                if (transceiver && transceiver.sender) {
                    transceiver.sender.replaceTrack(null).catch(e => console.warn(e));
                }
            });
            set({ isAudioMuted: true, localStream: updatedStream });
        }
    },

    toggleVideo: async () => {
        const { localStream, isVideoMuted, peerConnections } = get();
        if (isVideoMuted) {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = newStream.getVideoTracks()[0];
                let updatedStream = newStream;
                if (localStream) {
                    updatedStream = new MediaStream([
                        ...localStream.getAudioTracks(),
                        newVideoTrack
                    ]);
                }
                const currentPCs = get().peerConnections;
                Object.values(currentPCs).forEach(pc => {
                    if (pc.signalingState === 'closed') return;
                    const transceiver = pc.getTransceivers()[1];
                    if (transceiver && transceiver.sender) {
                        transceiver.sender.replaceTrack(newVideoTrack).catch(e => console.warn(e));
                    }
                });
                set({ isVideoMuted: false, localStream: updatedStream });
            } catch (err) {
                console.warn("Failed to enable video", err);
                setTimeout(() => {
                    useModalStore.getState().showAlert("Camera Error", "Failed to access camera. Please check your browser permissions.");
                }, 0);
            }
        } else {
            let updatedStream = localStream;
            if (localStream) {
                localStream.getVideoTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                });
                updatedStream = new MediaStream(localStream.getAudioTracks());
            }
            const currentPCs = get().peerConnections;
            Object.values(currentPCs).forEach(pc => {
                if (pc.signalingState === 'closed') return;
                const transceiver = pc.getTransceivers()[1];
                if (transceiver && transceiver.sender) {
                    transceiver.sender.replaceTrack(null).catch(e => console.warn(e));
                }
            });
            set({ isVideoMuted: true, localStream: updatedStream });
        }
    },

    startScreenShare: async (onStop?: () => void) => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const { peerConnections } = get();
            
            const screenTrack = screenStream.getVideoTracks()[0];
            const currentPCs = get().peerConnections;
            
            // Replace video track in all peer connections for transceiver index 2
            Object.values(currentPCs).forEach(pc => {
                if (pc.signalingState === 'closed') return;
                const transceiver = pc.getTransceivers()[2];
                if (transceiver && transceiver.sender) {
                    transceiver.sender.replaceTrack(screenTrack).catch(e => console.warn(e));
                }
            });

            // Handle when user clicks "Stop sharing" in the browser UI
            screenTrack.onended = () => {
                get().stopScreenShare();
                if (onStop) onStop();
            };

            set({ isScreenSharing: true, localScreenStream: screenStream });
        } catch (err) {
            console.warn('Failed to start screen share', err);
        }
    },

    stopScreenShare: async () => {
        try {
            const { peerConnections, localScreenStream } = get();
            
            // Stop the screen share tracks
            if (localScreenStream) {
                localScreenStream.getTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                });
            }
            
            const currentPCs = get().peerConnections;
            Object.values(currentPCs).forEach(pc => {
                if (pc.signalingState === 'closed') return;
                const transceiver = pc.getTransceivers()[2];
                if (transceiver && transceiver.sender) {
                    transceiver.sender.replaceTrack(null).catch(e => console.warn(e));
                }
            });

            set({ isScreenSharing: false, localScreenStream: null });
        } catch (err) {
            console.error('Failed to stop screen share', err);
        }
    },

    setRemoteScreenShare: (userId, isSharing) => set((state) => {
        const intents = { ...state.remoteScreenShareIntents, [userId]: isSharing };
        
        if (isSharing) {
            return { remoteScreenShareIntents: intents, isRemoteScreenSharing: true };
        } else {
            return { remoteScreenShareIntents: intents, isRemoteScreenSharing: false };
        }
    })
}));
