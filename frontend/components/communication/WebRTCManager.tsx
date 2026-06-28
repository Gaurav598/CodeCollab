import React, { useEffect, useRef } from 'react';
import { useWebRTCStore } from '@/store/webrtcStore';
import { stompService } from '@/services/stompClient';
import { useAuthStore } from '@/store/authStore';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff } from 'lucide-react';

interface WebRTCManagerProps {
    roomId: string;
}

function VideoTile({
    stream,
    muted,
    label,
    isVideoOff,
}: {
    stream: MediaStream | null;
    muted?: boolean;
    label: string;
    isVideoOff?: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative rounded-xl overflow-hidden bg-zinc-900 aspect-video w-full shadow-lg">
            {stream && !isVideoOff ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center">
                            <VideoOff className="text-zinc-400 w-7 h-7" />
                        </div>
                        <span className="text-xs text-zinc-400">Camera off</span>
                    </div>
                </div>
            )}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md text-xs text-white font-medium">
                    {label}
                </span>
            </div>
        </div>
    );
}

export function WebRTCManager({ roomId }: WebRTCManagerProps) {
    const currentUser = useAuthStore(state => state.user);
    const {
        localStream,
        remoteStreams,
        setLocalStream,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
    } = useWebRTCStore();

    // Initialize local stream
    useEffect(() => {
        let isMounted = true;
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                if (isMounted) setLocalStream(stream);
            })
            .catch(err => {
                console.error("Could not get media", err);
                if (isMounted) {
                    useWebRTCStore.setState({ isVideoMuted: true, isAudioMuted: true });
                }
            });

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

        const subPresence = stompService.subscribe(`/topic/room.${roomId}.presence`, (msg) => {
            const data = JSON.parse(msg.body);
            const { userId, status } = data;

            if (userId === currentUser?.id) return;

            if (status === 'JOINED') {
                useWebRTCStore.getState().createPeerConnection(userId, true, roomId);
            } else if (status === 'LEFT') {
                useWebRTCStore.getState().removePeerConnection(userId);
                useWebRTCStore.getState().removeRemoteStream(userId);
            }
        });

        return () => {
            if (subSignal) subSignal.unsubscribe();
            if (subPresence) subPresence.unsubscribe();

            const { peerConnections, removePeerConnection, removeRemoteStream, localStream } = useWebRTCStore.getState();
            Object.keys(peerConnections).forEach(userId => {
                removePeerConnection(userId);
                removeRemoteStream(userId);
            });
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                useWebRTCStore.setState({ localStream: null, isVideoMuted: false, isAudioMuted: false });
            }
        };
    }, [roomId, currentUser?.id]);

    const remoteEntries = Object.entries(remoteStreams);
    const totalParticipants = 1 + remoteEntries.length;

    // Responsive grid: 1 col for 1 user, 2 cols for 2-4 users
    const gridClass = totalParticipants === 1
        ? 'grid-cols-1'
        : 'grid-cols-2';

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Video Grid */}
            <div className={`grid ${gridClass} gap-3`}>
                <VideoTile
                    stream={localStream}
                    muted
                    label={`You${isAudioMuted ? ' 🔇' : ''}`}
                    isVideoOff={isVideoMuted}
                />
                {remoteEntries.map(([userId, stream]) => (
                    <VideoTile
                        key={userId}
                        stream={stream}
                        label={`User ${userId.substring(0, 6)}`}
                    />
                ))}
            </div>

            {/* Self-only Controls */}
            <div className="flex justify-center gap-3 pt-2">
                {/* Mic toggle — controls only YOUR microphone */}
                <button
                    onClick={toggleAudio}
                    title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
                    className={`p-3 rounded-full transition-all shadow-md ${
                        isAudioMuted
                            ? 'bg-red-500 hover:bg-red-600 ring-2 ring-red-400/50'
                            : 'bg-zinc-700 hover:bg-zinc-600'
                    } text-white`}
                >
                    {isAudioMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Camera toggle — controls only YOUR camera */}
                <button
                    onClick={toggleVideo}
                    title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
                    className={`p-3 rounded-full transition-all shadow-md ${
                        isVideoMuted
                            ? 'bg-red-500 hover:bg-red-600 ring-2 ring-red-400/50'
                            : 'bg-zinc-700 hover:bg-zinc-600'
                    } text-white`}
                >
                    {isVideoMuted ? <VideoOff size={18} /> : <Video size={18} />}
                </button>

                {/* Screen share — controls only YOUR screen */}
                <button
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
                    className={`p-3 rounded-full transition-all shadow-md ${
                        isScreenSharing
                            ? 'bg-blue-500 hover:bg-blue-600 ring-2 ring-blue-400/50'
                            : 'bg-zinc-700 hover:bg-zinc-600'
                    } text-white`}
                >
                    <MonitorUp size={18} />
                </button>

                {/* Leave call */}
                <button
                    title="Leave call"
                    className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-md"
                    onClick={() => {
                        const { peerConnections, removePeerConnection, removeRemoteStream } = useWebRTCStore.getState();
                        Object.keys(peerConnections).forEach(uid => {
                            removePeerConnection(uid);
                            removeRemoteStream(uid);
                        });
                        if (localStream) {
                            localStream.getTracks().forEach(t => t.stop());
                            useWebRTCStore.setState({ localStream: null });
                        }
                    }}
                >
                    <PhoneOff size={18} />
                </button>
            </div>

            <p className="text-center text-xs text-zinc-500 pb-1">
                You control only your own microphone, camera, and screen.
            </p>
        </div>
    );
}
