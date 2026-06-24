import React, { useEffect, useRef } from 'react';
import { useWebRTCStore } from '@/store/webrtcStore';
import { stompService } from '@/services/stompClient';
import { useAuthStore } from '@/store/authStore';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff } from 'lucide-react';

interface WebRTCManagerProps {
    roomId: string;
}

export function WebRTCManager({ roomId }: WebRTCManagerProps) {
    const currentUser = useAuthStore(state => state.user);
    const { 
        localStream, 
        remoteStreams, 
        setLocalStream,
        addRemoteStream,
        removeRemoteStream,
        addPeerConnection,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare
    } = useWebRTCStore();

    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Initialize local stream
    useEffect(() => {
        let isMounted = true;
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                if (isMounted) setLocalStream(stream);
            })
            .catch(err => console.error("Could not get media", err));

        return () => {
            isMounted = false;
        };
    }, [setLocalStream]);

    // Handle signaling and presence
    useEffect(() => {
        const subSignal = stompService.subscribe(`/user/queue/webrtc.signal`, async (msg) => {
            const data = JSON.parse(msg.body);
            const { senderId, type, payload } = data;
            
            let pc = useWebRTCStore.getState().peerConnections[senderId];

            try {
                if (type === 'OFFER') {
                    if (!pc) pc = useWebRTCStore.getState().createPeerConnection(senderId, false, roomId);
                    await pc.setRemoteDescription(new RTCSessionDescription(payload));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    stompService.publish('/app/webrtc.signal', {
                        targetUserId: senderId,
                        roomId,
                        type: 'ANSWER',
                        payload: pc.localDescription
                    });
                } else if (type === 'ANSWER') {
                    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload));
                } else if (type === 'ICE') {
                    if (pc) await pc.addIceCandidate(new RTCIceCandidate(payload));
                }
            } catch (err) {
                console.error('[WebRTC] Signaling error', err);
            }
        });

        // Listen for presence JOINED to initiate WebRTC OFFER
        const subPresence = stompService.subscribe(`/topic/room.${roomId}.presence`, (msg) => {
            const data = JSON.parse(msg.body);
            const { userId, status } = data;
            
            if (userId === currentUser?.id) return; // Ignore self

            if (status === 'JOINED') {
                // I was already here, a new user joined. I am the initiator.
                useWebRTCStore.getState().createPeerConnection(userId, true, roomId);
            } else if (status === 'LEFT') {
                useWebRTCStore.getState().removePeerConnection(userId);
                useWebRTCStore.getState().removeRemoteStream(userId);
            }
        });

        return () => {
            if (subSignal) subSignal.unsubscribe();
            if (subPresence) subPresence.unsubscribe();
            
            // Clean up all connections on unmount
            const { peerConnections, removePeerConnection, removeRemoteStream } = useWebRTCStore.getState();
            Object.keys(peerConnections).forEach(userId => {
                removePeerConnection(userId);
                removeRemoteStream(userId);
            });
        };
    }, [roomId, currentUser?.id]);

    const handleToggleScreenShare = () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            startScreenShare();
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {/* Local Video */}
                <div className="relative rounded-lg overflow-hidden bg-zinc-900 aspect-video">
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`} 
                    />
                    {isVideoMuted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                            <VideoOff className="text-zinc-500 w-12 h-12" />
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                        You {isAudioMuted && <MicOff size={12} className="inline ml-1 text-red-400" />}
                    </div>
                </div>

                {/* Remote Videos */}
                {Object.entries(remoteStreams).map(([userId, stream]) => (
                    <div key={userId} className="relative rounded-lg overflow-hidden bg-zinc-900 aspect-video">
                        <video 
                            autoPlay 
                            playsInline 
                            ref={el => { if (el) el.srcObject = stream; }}
                            className="w-full h-full object-cover" 
                        />
                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                            User {userId.substring(0, 4)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3 mt-4">
                <button 
                    onClick={toggleAudio}
                    className={`p-3 rounded-full ${isAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-zinc-700 hover:bg-zinc-600'} text-white transition-colors`}
                >
                    {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button 
                    onClick={toggleVideo}
                    className={`p-3 rounded-full ${isVideoMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-zinc-700 hover:bg-zinc-600'} text-white transition-colors`}
                >
                    {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
                <button 
                    onClick={handleToggleScreenShare}
                    className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-zinc-700 hover:bg-zinc-600'} text-white transition-colors`}
                >
                    <MonitorUp size={20} />
                </button>
                <button 
                    className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                    <PhoneOff size={20} />
                </button>
            </div>
        </div>
    );
}
