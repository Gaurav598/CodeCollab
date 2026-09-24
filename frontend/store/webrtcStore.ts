import { create } from 'zustand';
import { stompService } from '@/services/stompClient';
import { useModalStore } from './modalStore';

interface WebRTCState {
    localStream: MediaStream | null;
    remoteStreams: Record<string, MediaStream>; // keyed by userId
    peerConnections: Record<string, RTCPeerConnection>; // keyed by userId
    peerMediaSenders: Record<string, PeerMediaSenders>;
    remoteMediaMids: Record<string, MediaMids>;
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
    setPeerMediaSenders: (userId: string, senders: PeerMediaSenders) => void;
    setRemoteMediaMids: (userId: string, mids: MediaMids) => void;
    attachLocalTracks: (userId: string, mids: MediaMids) => Promise<void>;
    cleanupLocalMedia: () => void;
    setRemoteVideoState: (userId: string, isMuted: boolean) => void;
    setRemoteAudioState: (userId: string, isMuted: boolean) => void;
    createPeerConnection: (targetUserId: string, isInitiator: boolean, roomId: string) => RTCPeerConnection;
    remoteScreenShareIntents: Record<string, boolean>;
}

export interface MediaMids {
    audio?: string | null;
    camera?: string | null;
    screen?: string | null;
}

interface PeerMediaSenders {
    audio?: RTCRtpSender;
    camera?: RTCRtpSender;
    screen?: RTCRtpSender;
}

function iceConfiguration(): RTCConfiguration {
    const iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    if (turnUrl) {
        iceServers.push({
            urls: turnUrl.split(',').map(value => value.trim()).filter(Boolean),
            username: process.env.NEXT_PUBLIC_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
        });
    }
    return { iceServers };
}

export const useWebRTCStore = create<WebRTCState>((set, get) => ({
    localStream: null,
    remoteStreams: {},
    peerConnections: {},
    peerMediaSenders: {},
    remoteMediaMids: {},
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
        state.remoteStreams[userId]?.getTracks().forEach(track => track.stop());
        state.remoteScreenStreams[userId]?.getTracks().forEach(track => track.stop());
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
        const senders = { ...state.peerMediaSenders };
        const mids = { ...state.remoteMediaMids };
        const videoStates = { ...state.remoteVideoStates };
        const audioStates = { ...state.remoteAudioStates };
        delete senders[userId];
        delete mids[userId];
        delete videoStates[userId];
        delete audioStates[userId];
        return {
            peerConnections: newPCs,
            peerMediaSenders: senders,
            remoteMediaMids: mids,
            remoteVideoStates: videoStates,
            remoteAudioStates: audioStates,
        };
    }),

    setPeerMediaSenders: (userId, senders) => set(state => ({
        peerMediaSenders: { ...state.peerMediaSenders, [userId]: senders }
    })),

    setRemoteMediaMids: (userId, mids) => set(state => ({
        remoteMediaMids: { ...state.remoteMediaMids, [userId]: mids }
    })),

    attachLocalTracks: async (userId, mids) => {
        const pc = get().peerConnections[userId];
        if (!pc) return;
        const byMid = new Map(pc.getTransceivers().map(transceiver => [transceiver.mid, transceiver]));
        const audio = mids.audio ? byMid.get(mids.audio)?.sender : undefined;
        const camera = mids.camera ? byMid.get(mids.camera)?.sender : undefined;
        const screen = mids.screen ? byMid.get(mids.screen)?.sender : undefined;
        const localStream = get().localStream;
        const localScreenStream = get().localScreenStream;
        await Promise.all([
            audio?.replaceTrack(localStream?.getAudioTracks()[0] ?? null),
            camera?.replaceTrack(localStream?.getVideoTracks()[0] ?? null),
            screen?.replaceTrack(localScreenStream?.getVideoTracks()[0] ?? null),
        ].filter(Boolean));
        get().setPeerMediaSenders(userId, { audio, camera, screen });
    },

    cleanupLocalMedia: () => {
        const { localStream, localScreenStream } = get();
        localStream?.getTracks().forEach(track => track.stop());
        localScreenStream?.getTracks().forEach(track => track.stop());
        set({
            localStream: null,
            localScreenStream: null,
            isAudioMuted: true,
            isVideoMuted: true,
            isScreenSharing: false,
        });
    },

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
        const pc = new RTCPeerConnection(iceConfiguration());
        const { localStream, addRemoteStream } = get();

        const senders: PeerMediaSenders = {};

        if (isInitiator) {
            const audioTrack = localStream?.getTracks().find(t => t.kind === 'audio');
            if (audioTrack) {
                senders.audio = pc.addTransceiver(audioTrack, { direction: 'sendrecv', streams: [localStream!] }).sender;
            } else {
                senders.audio = pc.addTransceiver('audio', { direction: 'sendrecv' }).sender;
            }

            const videoTrack = localStream?.getTracks().find(t => t.kind === 'video');
            if (videoTrack) {
                senders.camera = pc.addTransceiver(videoTrack, { direction: 'sendrecv', streams: [localStream!] }).sender;
            } else {
                senders.camera = pc.addTransceiver('video', { direction: 'sendrecv' }).sender;
            }

            const localScreenStream = get().localScreenStream;
            const screenTrack = localScreenStream?.getVideoTracks()[0];
            if (screenTrack) {
                senders.screen = pc.addTransceiver(screenTrack, { direction: 'sendrecv', streams: [localScreenStream!] }).sender;
            } else {
                senders.screen = pc.addTransceiver('video', { direction: 'sendrecv' }).sender;
            }
            get().setPeerMediaSenders(targetUserId, senders);
        }

        pc.ontrack = (event) => {
            const screenMid = get().remoteMediaMids[targetUserId]?.screen;
            if (screenMid && event.transceiver.mid === screenMid) {
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

        let disconnectedTimer: ReturnType<typeof setTimeout> | null = null;
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                if (disconnectedTimer) clearTimeout(disconnectedTimer);
                disconnectedTimer = null;
            } else if (pc.connectionState === 'disconnected') {
                if (disconnectedTimer) clearTimeout(disconnectedTimer);
                disconnectedTimer = setTimeout(() => {
                    if (pc.connectionState === 'disconnected' && isInitiator) {
                        pc.restartIce();
                    }
                }, 3000);
            } else if (pc.connectionState === 'failed' && isInitiator) {
                pc.restartIce();
            } else if (pc.connectionState === 'closed') {
                if (disconnectedTimer) clearTimeout(disconnectedTimer);
            }
        };

        // Handle negotiation needed
        pc.onnegotiationneeded = async () => {
            if (isInitiator) {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    const transceivers = pc.getTransceivers();
                    const mids: MediaMids = {
                        audio: transceivers.find(t => t.sender === senders.audio)?.mid,
                        camera: transceivers.find(t => t.sender === senders.camera)?.mid,
                        screen: transceivers.find(t => t.sender === senders.screen)?.mid,
                    };
                    get().setRemoteMediaMids(targetUserId, mids);
                    stompService.publish('/app/webrtc.signal', {
                        targetUserId,
                        roomId,
                        type: 'OFFER',
                        payload: { description: pc.localDescription, mediaMids: mids }
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
                    localStream.getAudioTracks().forEach(track => track.stop());
                    updatedStream = new MediaStream([
                        ...localStream.getVideoTracks(),
                        newAudioTrack
                    ]);
                }
                Object.entries(get().peerConnections).forEach(([userId, pc]) => {
                    if (pc.signalingState === 'closed') return;
                    get().peerMediaSenders[userId]?.audio?.replaceTrack(newAudioTrack).catch(e => console.warn(e));
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
            Object.entries(get().peerConnections).forEach(([userId, pc]) => {
                if (pc.signalingState === 'closed') return;
                get().peerMediaSenders[userId]?.audio?.replaceTrack(null).catch(e => console.warn(e));
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
                    localStream.getVideoTracks().forEach(track => track.stop());
                    updatedStream = new MediaStream([
                        ...localStream.getAudioTracks(),
                        newVideoTrack
                    ]);
                }
                Object.entries(get().peerConnections).forEach(([userId, pc]) => {
                    if (pc.signalingState === 'closed') return;
                    get().peerMediaSenders[userId]?.camera?.replaceTrack(newVideoTrack).catch(e => console.warn(e));
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
            Object.entries(get().peerConnections).forEach(([userId, pc]) => {
                if (pc.signalingState === 'closed') return;
                get().peerMediaSenders[userId]?.camera?.replaceTrack(null).catch(e => console.warn(e));
            });
            set({ isVideoMuted: true, localStream: updatedStream });
        }
    },

    startScreenShare: async (onStop?: () => void) => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];
            Object.entries(get().peerConnections).forEach(([userId, pc]) => {
                if (pc.signalingState === 'closed') return;
                get().peerMediaSenders[userId]?.screen?.replaceTrack(screenTrack).catch(e => console.warn(e));
            });

            // Handle when user clicks "Stop sharing" in the browser UI
            screenTrack.onended = () => {
                get().stopScreenShare();
                if (onStop) onStop();
            };

            set({ isScreenSharing: true, localScreenStream: screenStream });
        } catch (err) {
            console.warn('Failed to start screen share', err);
            setTimeout(() => {
                useModalStore.getState().showAlert(
                    "Screen Share Error",
                    "Screen sharing could not start. Check browser permission and try again."
                );
            }, 0);
        }
    },

    stopScreenShare: async () => {
        try {
            const { localScreenStream } = get();
            
            // Stop the screen share tracks
            if (localScreenStream) {
                localScreenStream.getTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                });
            }
            
            Object.entries(get().peerConnections).forEach(([userId, pc]) => {
                if (pc.signalingState === 'closed') return;
                get().peerMediaSenders[userId]?.screen?.replaceTrack(null).catch(e => console.warn(e));
            });

            set({ isScreenSharing: false, localScreenStream: null });
        } catch (err) {
            console.error('Failed to stop screen share', err);
        }
    },

    setRemoteScreenShare: (userId, isSharing) => set((state) => {
        const intents = { ...state.remoteScreenShareIntents, [userId]: isSharing };
        if (!isSharing) delete intents[userId];
        
        return {
            remoteScreenShareIntents: intents,
            isRemoteScreenSharing: Object.values(intents).some(Boolean)
        };
    })
}));
