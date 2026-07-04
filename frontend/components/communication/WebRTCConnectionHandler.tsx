'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWebRTCStore } from '@/store/webrtcStore';
import { stompService } from '@/services/stompClient';
import { canUseMedia } from '@/utils/permissions';

export function WebRTCConnectionHandler({ roomId, userRole = 'editor' }: { roomId: string, userRole?: string }) {
    const currentUser = useAuthStore(state => state.user);
    const pendingCandidates = useRef<Record<string, any[]>>({});

    useEffect(() => {
        if (!currentUser?.id || !roomId) return;

        const subSignal = stompService.subscribe(`/user/queue/webrtc.signal`, async (msg) => {
            const data = JSON.parse(msg.body);
            const { targetUserId, type, payload, roomId: msgRoomId } = data;
            const senderId = data.senderId || data.userId; 

            if (msgRoomId !== roomId) return;

            try {
                let pc = useWebRTCStore.getState().peerConnections[senderId];
                
                if (!pendingCandidates.current[senderId]) {
                    pendingCandidates.current[senderId] = [];
                }

                if (type === 'OFFER') {
                    if (!pc) {
                        pc = useWebRTCStore.getState().createPeerConnection(senderId, false, roomId);
                    }
                    await pc.setRemoteDescription(new RTCSessionDescription(payload));
                    
                    // The browser just created transceivers based on the offer. Attach local tracks to them.
                    const transceivers = pc.getTransceivers();
                    const localStream = useWebRTCStore.getState().localStream;
                    const localScreenStream = useWebRTCStore.getState().localScreenStream;
                    
                    if (transceivers[0] && localStream) {
                        const audioTrack = localStream.getAudioTracks()[0];
                        if (audioTrack) transceivers[0].sender.replaceTrack(audioTrack);
                    }
                    if (transceivers[1] && localStream) {
                        const videoTrack = localStream.getVideoTracks()[0];
                        if (videoTrack) transceivers[1].sender.replaceTrack(videoTrack);
                    }
                    if (transceivers[2] && localScreenStream) {
                        const screenTrack = localScreenStream.getVideoTracks()[0];
                        if (screenTrack) transceivers[2].sender.replaceTrack(screenTrack);
                    }
                    
                    // Force all transceivers to 'sendrecv' so the answer includes a=sendrecv
                    // This is crucial because setRemoteDescription defaults them to recvonly if no track was provided initially
                    transceivers.forEach(t => {
                        if (t.direction !== 'stopped') {
                            t.direction = 'sendrecv';
                        }
                    });
                    
                    while (pendingCandidates.current[senderId].length > 0) {
                        const candidate = pendingCandidates.current[senderId].shift();
                        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.warn("Failed to add queued ICE:", e));
                    }

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    stompService.publish('/app/webrtc.signal', {
                        targetUserId: senderId,
                        roomId,
                        type: 'ANSWER',
                        payload: pc.localDescription
                    });
                } else if (type === 'ANSWER') {
                    if (pc) {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload));
                        while (pendingCandidates.current[senderId].length > 0) {
                            const candidate = pendingCandidates.current[senderId].shift();
                            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.warn("Failed to add queued ICE:", e));
                        }
                    }
                } else if (type === 'ICE') {
                    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                        pc.addIceCandidate(new RTCIceCandidate(payload)).catch(e => console.warn("Failed to add ICE:", e));
                    } else {
                        pendingCandidates.current[senderId].push(payload);
                    }
                }
            } catch (err) {
                console.error('[WebRTC] Signaling error', err);
            }
        });

        const subVideoPresence = stompService.subscribe(`/topic/room.${roomId}.video.presence`, (msg) => {
            const data = JSON.parse(msg.body);
            const { userId, type } = data;

            if (userId === currentUser?.id) return;

            if (type === 'MEDIA_STATE' || type === 'VIDEO_STATE') {
                if (data.isVideoMuted !== undefined) useWebRTCStore.getState().setRemoteVideoState(userId, data.isVideoMuted);
                if (data.isAudioMuted !== undefined) useWebRTCStore.getState().setRemoteAudioState(userId, data.isAudioMuted);
            } else if (type === 'SCREEN_SHARE_START') {
                useWebRTCStore.getState().setRemoteScreenShare(userId, true);
            } else if (type === 'SCREEN_SHARE_STOP') {
                useWebRTCStore.getState().setRemoteScreenShare(userId, false);
            } else if (type === 'JOINED') {
                // Tell the new user our current mute state immediately
                stompService.publish(`/topic/room.${roomId}.video.presence`, { 
                    type: 'MEDIA_STATE', 
                    userId: currentUser?.id, 
                    isVideoMuted: useWebRTCStore.getState().isVideoMuted,
                    isAudioMuted: useWebRTCStore.getState().isAudioMuted
                });
                // Also tell them if we are screen sharing
                if (useWebRTCStore.getState().isScreenSharing) {
                    stompService.publish(`/topic/room.${roomId}.video.presence`, { type: 'SCREEN_SHARE_START', userId: currentUser?.id });
                }
                
                if (currentUser!.id > userId) {
                    if (!useWebRTCStore.getState().peerConnections[userId]) {
                        useWebRTCStore.getState().createPeerConnection(userId, true, roomId);
                    }
                } else {
                    stompService.publish(`/topic/room.${roomId}.video.presence`, { type: 'PRESENT', userId: currentUser?.id });
                }
            } else if (type === 'PRESENT') {
                if (currentUser!.id > userId) {
                    if (!useWebRTCStore.getState().peerConnections[userId]) {
                        useWebRTCStore.getState().createPeerConnection(userId, true, roomId);
                    }
                }
            } else if (type === 'LEFT') {
                useWebRTCStore.getState().removePeerConnection(userId);
                useWebRTCStore.getState().removeRemoteStream(userId);
                useWebRTCStore.getState().setRemoteScreenShare(userId, false);
            }
        });

        const joinTimeout = setTimeout(() => {
            stompService.publish(`/topic/room.${roomId}.video.presence`, { type: 'JOINED', userId: currentUser?.id });
        }, 300);

        return () => {
            clearTimeout(joinTimeout);
            stompService.publish(`/topic/room.${roomId}.video.presence`, { type: 'LEFT', userId: currentUser?.id });
            stompService.unsubscribe(`/user/queue/webrtc.signal`);
            stompService.unsubscribe(`/topic/room.${roomId}.video.presence`);

            const { peerConnections, removePeerConnection, removeRemoteStream } = useWebRTCStore.getState();
            Object.keys(peerConnections).forEach(userId => {
                removePeerConnection(userId);
                removeRemoteStream(userId);
            });
        };
    }, [roomId, currentUser?.id]);

    return null;
}
