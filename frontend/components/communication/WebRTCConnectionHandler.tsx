'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWebRTCStore } from '@/store/webrtcStore';
import { stompService } from '@/services/stompClient';
import { canUseMedia } from '@/utils/permissions';
import type { MediaMids } from '@/store/webrtcStore';

export function WebRTCConnectionHandler({ roomId, userRole = 'editor' }: { roomId: string, userRole?: string }) {
    const currentUser = useAuthStore(state => state.user);
    const pendingCandidates = useRef<Record<string, any[]>>({});
    const seenCandidates = useRef<Record<string, Set<string>>>({});
    const remoteIceUfrags = useRef<Record<string, string>>({});

    useEffect(() => {
        if (!currentUser?.id || !roomId || !canUseMedia(userRole)) return;

        const beginRemoteIceGeneration = (userId: string, description: RTCSessionDescriptionInit) => {
            const nextUfrag = description.sdp?.match(/^a=ice-ufrag:(.+)$/m)?.[1]?.trim();
            if (!nextUfrag || remoteIceUfrags.current[userId] === nextUfrag) return;

            remoteIceUfrags.current[userId] = nextUfrag;
            seenCandidates.current[userId] = new Set();
            pendingCandidates.current[userId] = (pendingCandidates.current[userId] || []).filter(candidate =>
                !candidate?.usernameFragment || candidate.usernameFragment === nextUfrag
            );
        };

        const handleSignal = async (msg: import('@stomp/stompjs').IMessage) => {
            const data = JSON.parse(msg.body);
            const { type, payload, roomId: msgRoomId } = data;
            const senderId = data.senderId || data.userId; 

            if (msgRoomId !== roomId) return;

            try {
                let pc = useWebRTCStore.getState().peerConnections[senderId];
                
                if (!pendingCandidates.current[senderId]) {
                    pendingCandidates.current[senderId] = [];
                }
                if (!seenCandidates.current[senderId]) {
                    seenCandidates.current[senderId] = new Set();
                }

                if (type === 'OFFER') {
                    if (!pc) {
                        pc = useWebRTCStore.getState().createPeerConnection(senderId, false, roomId);
                    }
                    const description = payload?.description ?? payload;
                    const mediaMids: MediaMids = payload?.mediaMids ?? {};
                    beginRemoteIceGeneration(senderId, description);
                    useWebRTCStore.getState().setRemoteMediaMids(senderId, mediaMids);
                    await pc.setRemoteDescription(new RTCSessionDescription(description));
                    
                    // The browser just created transceivers based on the offer. Attach local tracks to them.
                    const transceivers = pc.getTransceivers();
                    await useWebRTCStore.getState().attachLocalTracks(senderId, mediaMids);
                    
                    // Force all transceivers to 'sendrecv' so the answer includes a=sendrecv
                    // This is crucial because setRemoteDescription defaults them to recvonly if no track was provided initially
                    transceivers.forEach(t => {
                        if (t.direction !== 'stopped') {
                            t.direction = 'sendrecv';
                        }
                    });
                    
                    while (pendingCandidates.current[senderId].length > 0) {
                        const candidate = pendingCandidates.current[senderId].shift();
                        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.warn("Failed to add queued ICE:", e));
                    }

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    stompService.publish('/app/webrtc.signal', {
                        targetUserId: senderId,
                        roomId,
                        type: 'ANSWER',
                        payload: { description: pc.localDescription, mediaMids }
                    });
                } else if (type === 'ANSWER') {
                    if (pc) {
                        const description = payload?.description ?? payload;
                        const mediaMids: MediaMids = payload?.mediaMids ?? useWebRTCStore.getState().remoteMediaMids[senderId] ?? {};
                        beginRemoteIceGeneration(senderId, description);
                        useWebRTCStore.getState().setRemoteMediaMids(senderId, mediaMids);
                        if (pc.signalingState !== 'stable') {
                            await pc.setRemoteDescription(new RTCSessionDescription(description));
                        }
                        while (pendingCandidates.current[senderId].length > 0) {
                            const candidate = pendingCandidates.current[senderId].shift();
                            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.warn("Failed to add queued ICE:", e));
                        }
                    }
                } else if (type === 'ICE') {
                    const remoteUfrag = remoteIceUfrags.current[senderId];
                    if (remoteUfrag && payload?.usernameFragment && payload.usernameFragment !== remoteUfrag) {
                        return;
                    }
                    const candidateKey = `${payload?.usernameFragment || remoteUfrag || 'unknown'}:${JSON.stringify(payload)}`;
                    if (seenCandidates.current[senderId].has(candidateKey)) return;
                    seenCandidates.current[senderId].add(candidateKey);
                    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                        await pc.addIceCandidate(new RTCIceCandidate(payload)).catch(e => console.warn("Failed to add ICE:", e));
                    } else {
                        if (pendingCandidates.current[senderId].length < 128) {
                            pendingCandidates.current[senderId].push(payload);
                        }
                    }
                }
            } catch (err) {
                console.error('[WebRTC] Signaling error', err);
            }
        };
        stompService.subscribe(`/user/queue/webrtc.signal`, handleSignal);

        const handleVideoPresence = (msg: import('@stomp/stompjs').IMessage) => {
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
                stompService.publish('/app/video.presence', {
                    roomId,
                    type: 'MEDIA_STATE', 
                    userId: currentUser?.id, 
                    isVideoMuted: useWebRTCStore.getState().isVideoMuted,
                    isAudioMuted: useWebRTCStore.getState().isAudioMuted
                });
                // Also tell them if we are screen sharing
                if (useWebRTCStore.getState().isScreenSharing) {
                    stompService.publish('/app/video.presence', { roomId, type: 'SCREEN_SHARE_START' });
                }
                
                if (currentUser!.id > userId) {
                    if (!useWebRTCStore.getState().peerConnections[userId]) {
                        useWebRTCStore.getState().createPeerConnection(userId, true, roomId);
                    }
                } else {
                    stompService.publish('/app/video.presence', { roomId, type: 'PRESENT' });
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
                delete pendingCandidates.current[userId];
                delete seenCandidates.current[userId];
                delete remoteIceUfrags.current[userId];
            }
        };
        stompService.subscribe(`/topic/room.${roomId}.video.presence`, handleVideoPresence);

        const announcePresence = () => {
            const state = useWebRTCStore.getState();
            Object.keys(state.peerConnections).forEach(userId => {
                state.removePeerConnection(userId);
                state.removeRemoteStream(userId);
                state.setRemoteScreenShare(userId, false);
            });
            pendingCandidates.current = {};
            seenCandidates.current = {};
            remoteIceUfrags.current = {};
            stompService.publish('/app/video.presence', { roomId, type: 'JOINED' });
        };
        const unsubscribeConnected = stompService.onConnected(announcePresence);

        return () => {
            unsubscribeConnected();
            stompService.publish('/app/video.presence', { roomId, type: 'LEFT' });
            stompService.unsubscribe(`/user/queue/webrtc.signal`, handleSignal);
            stompService.unsubscribe(`/topic/room.${roomId}.video.presence`, handleVideoPresence);

            const { peerConnections, removePeerConnection, removeRemoteStream } = useWebRTCStore.getState();
            Object.keys(peerConnections).forEach(userId => {
                removePeerConnection(userId);
                removeRemoteStream(userId);
            });
            pendingCandidates.current = {};
            seenCandidates.current = {};
            remoteIceUfrags.current = {};
        };
    }, [roomId, currentUser?.id, userRole]);

    return null;
}
