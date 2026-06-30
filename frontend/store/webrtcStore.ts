import { create } from 'zustand';
import { stompService } from '@/services/stompClient';
import { useModalStore } from './modalStore';

interface WebRTCState {
    localStream: MediaStream | null;
    remoteStreams: Record<string, MediaStream>; // keyed by userId
    peerConnections: Record<string, RTCPeerConnection>; // keyed by userId
    remoteVideoStates: Record<string, boolean>;
    isAudioMuted: boolean;
    isVideoMuted: boolean;
    isScreenSharing: boolean;
    isRemoteScreenSharing: boolean;
    remoteScreenStream: MediaStream | null;
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
    isAudioMuted: true,
    isVideoMuted: true,
    isScreenSharing: false,
    isRemoteScreenSharing: false,
    remoteScreenStream: null,
    remoteScreenShareIntents: {},

    setLocalStream: (stream) => set({ localStream: stream }),
    
    addRemoteStream: (userId, stream) => set((state) => {
        const isScreenIntended = state.remoteScreenShareIntents[userId];
        return {
            remoteStreams: { ...state.remoteStreams, [userId]: stream },
            ...(isScreenIntended ? { isRemoteScreenSharing: true, remoteScreenStream: stream } : {})
        };
    }),

    removeRemoteStream: (userId) => set((state) => {
        const newStreams = { ...state.remoteStreams };
        delete newStreams[userId];
        return { remoteStreams: newStreams };
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

    createPeerConnection: (targetUserId, isInitiator, roomId) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        const { localStream, addRemoteStream } = get();

        // Add local tracks, or transceivers if muted
        if (localStream && localStream.getTracks().length > 0) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        } else {
            const emptyStream = localStream || new MediaStream();
            pc.addTransceiver('audio', { direction: 'sendrecv', streams: [emptyStream] });
            pc.addTransceiver('video', { direction: 'sendrecv', streams: [emptyStream] });
        }

        // Handle remote tracks — detect if it's a screen share (display surface)
        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                const stream = event.streams[0];
                const videoTrack = stream.getVideoTracks()[0];
                // Heuristic: if the video track label contains 'screen' or 'display' it's a screen share
                const isScreen = videoTrack?.label?.toLowerCase().includes('screen') ||
                                 videoTrack?.label?.toLowerCase().includes('display') ||
                                 (videoTrack?.getSettings?.()?.displaySurface != null);
                if (isScreen) {
                    set({ isRemoteScreenSharing: true, remoteScreenStream: stream });
                } else {
                    addRemoteStream(targetUserId, stream);
                }
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
                
                if (localStream) {
                    localStream.addTrack(newAudioTrack);
                }
                
                Object.values(peerConnections).forEach(pc => {
                    const transceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'audio');
                    if (transceiver && transceiver.sender) {
                        transceiver.sender.replaceTrack(newAudioTrack);
                    }
                });
                set({ isAudioMuted: false, localStream: localStream || newStream });
            } catch (err) {
                console.error("Failed to enable audio", err);
                setTimeout(() => {
                    useModalStore.getState().showAlert("Microphone Error", "Failed to access microphone. Please check your browser permissions.");
                }, 0);
            }
        } else {
            if (localStream) {
                localStream.getAudioTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                    localStream.removeTrack(track);
                });
            }
            Object.values(peerConnections).forEach(pc => {
                const transceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'audio');
                if (transceiver && transceiver.sender) {
                    transceiver.sender.replaceTrack(null);
                }
            });
            set({ isAudioMuted: true });
        }
    },

    toggleVideo: async () => {
        const { localStream, isVideoMuted, peerConnections } = get();
        if (isVideoMuted) {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = newStream.getVideoTracks()[0];
                
                if (localStream) {
                    localStream.addTrack(newVideoTrack);
                }
                
                Object.values(peerConnections).forEach(pc => {
                    const transceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
                    if (transceiver && transceiver.sender) {
                        transceiver.sender.replaceTrack(newVideoTrack);
                    }
                });
                set({ isVideoMuted: false, localStream: localStream || newStream });
            } catch (err) {
                console.error("Failed to enable video", err);
                setTimeout(() => {
                    useModalStore.getState().showAlert("Camera Error", "Failed to access camera. Please check your browser permissions.");
                }, 0);
            }
        } else {
            if (localStream) {
                localStream.getVideoTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                    localStream.removeTrack(track);
                });
            }
            Object.values(peerConnections).forEach(pc => {
                const transceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
                if (transceiver && transceiver.sender) {
                    transceiver.sender.replaceTrack(null);
                }
            });
            set({ isVideoMuted: true });
        }
    },

    startScreenShare: async (onStop?: () => void) => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const { localStream, peerConnections } = get();
            
            const screenTrack = screenStream.getVideoTracks()[0];
            
            // Replace video track in all peer connections
            Object.values(peerConnections).forEach(pc => {
                const transceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
                if (transceiver && transceiver.sender) {
                    transceiver.sender.replaceTrack(screenTrack);
                }
            });

            // Handle when user clicks "Stop sharing" in the browser UI
            screenTrack.onended = () => {
                get().stopScreenShare();
                if (onStop) onStop();
            };

            set({ isScreenSharing: true, localStream: screenStream });
        } catch (err) {
            console.error('Failed to start screen share', err);
        }
    },

    stopScreenShare: async () => {
        try {
            const { peerConnections, localStream } = get();
            
            // Stop the screen share tracks
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            
            Object.values(peerConnections).forEach(pc => {
                const transceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
                if (transceiver && transceiver.sender) {
                    transceiver.sender.replaceTrack(null);
                }
            });

            // Recover the audio track if it is still being sent
            let currentAudioTrack = null;
            const pcIds = Object.keys(peerConnections);
            if (pcIds.length > 0) {
                const transceiver = peerConnections[pcIds[0]].getTransceivers().find(t => t.receiver.track.kind === 'audio');
                if (transceiver && transceiver.sender && transceiver.sender.track) {
                    currentAudioTrack = transceiver.sender.track;
                }
            }

            const newLocalStream = currentAudioTrack ? new MediaStream([currentAudioTrack]) : null;

            set({ isScreenSharing: false, localStream: newLocalStream, isVideoMuted: true });
        } catch (err) {
            console.error('Failed to stop screen share', err);
        }
    },

    setRemoteScreenShare: (userId, isSharing) => set((state) => {
        const intents = { ...state.remoteScreenShareIntents, [userId]: isSharing };
        const stream = state.remoteStreams[userId];
        
        if (isSharing && stream) {
            return { remoteScreenShareIntents: intents, isRemoteScreenSharing: true, remoteScreenStream: stream };
        } else if (!isSharing) {
            return { remoteScreenShareIntents: intents, isRemoteScreenSharing: false, remoteScreenStream: null };
        } else {
            return { remoteScreenShareIntents: intents };
        }
    })
}));
