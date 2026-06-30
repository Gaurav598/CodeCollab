'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWebRTCStore } from '@/store/webrtcStore';
import { stompService } from '@/services/stompClient';

export function WebRTCConnectionHandler({ roomId }: { roomId: string }) {
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

            if (type === 'VIDEO_STATE') {
                useWebRTCStore.getState().setRemoteVideoState(userId, data.isVideoMuted);
            } else if (type === 'SCREEN_SHARE_START') {
                useWebRTCStore.getState().setRemoteScreenShare(userId, true);
            } else if (type === 'SCREEN_SHARE_STOP') {
                useWebRTCStore.getState().setRemoteScreenShare(userId, false);
            } else if (type === 'JOINED') {
                // Tell the new user our current mute state immediately
                stompService.publish(`/topic/room.${roomId}.video.presence`, { type: 'VIDEO_STATE', userId: currentUser?.id, isVideoMuted: useWebRTCStore.getState().isVideoMuted });
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
