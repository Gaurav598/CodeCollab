import { create } from 'zustand';
import { stompService } from '@/services/stompClient';

interface WebRTCState {
    localStream: MediaStream | null;
    remoteStreams: Record<string, MediaStream>; // keyed by userId
    peerConnections: Record<string, RTCPeerConnection>; // keyed by userId
    isAudioMuted: boolean;
    isVideoMuted: boolean;
    isScreenSharing: boolean;
    setLocalStream: (stream: MediaStream) => void;
    addRemoteStream: (userId: string, stream: MediaStream) => void;
    removeRemoteStream: (userId: string) => void;
    toggleAudio: () => void;
    toggleVideo: () => void;
    startScreenShare: () => Promise<void>;
    stopScreenShare: () => Promise<void>;
    addPeerConnection: (userId: string, pc: RTCPeerConnection) => void;
    removePeerConnection: (userId: string) => void;
    createPeerConnection: (targetUserId: string, isInitiator: boolean, roomId: string) => RTCPeerConnection;
}

const ICE_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export const useWebRTCStore = create<WebRTCState>((set, get) => ({
    localStream: null,
    remoteStreams: {},
    peerConnections: {},
    isAudioMuted: false,
    isVideoMuted: false,
    isScreenSharing: false,

    setLocalStream: (stream) => set({ localStream: stream }),
    
    addRemoteStream: (userId, stream) => set((state) => ({
        remoteStreams: { ...state.remoteStreams, [userId]: stream }
    })),

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

    createPeerConnection: (targetUserId, isInitiator, roomId) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        const { localStream, addRemoteStream } = get();

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        // Handle remote tracks
        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                addRemoteStream(targetUserId, event.streams[0]);
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

    toggleAudio: () => {
        const { localStream, isAudioMuted } = get();
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = isAudioMuted;
            });
            set({ isAudioMuted: !isAudioMuted });
        }
    },

    toggleVideo: () => {
        const { localStream, isVideoMuted } = get();
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = isVideoMuted;
            });
            set({ isVideoMuted: !isVideoMuted });
        }
    },

    startScreenShare: async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const { localStream, peerConnections } = get();
            
            const screenTrack = screenStream.getVideoTracks()[0];
            
            // Replace video track in all peer connections
            Object.values(peerConnections).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });

            // Handle when user clicks "Stop sharing" in the browser UI
            screenTrack.onended = () => {
                get().stopScreenShare();
            };

            set({ isScreenSharing: true, localStream: screenStream });
        } catch (err) {
            console.error('Failed to start screen share', err);
        }
    },

    stopScreenShare: async () => {
        try {
            // Revert back to camera
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const { peerConnections } = get();
            
            const cameraTrack = cameraStream.getVideoTracks()[0];
            
            Object.values(peerConnections).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(cameraTrack);
                }
            });

            set({ isScreenSharing: false, localStream: cameraStream, isVideoMuted: false, isAudioMuted: false });
        } catch (err) {
            console.error('Failed to stop screen share', err);
        }
    }
}));
