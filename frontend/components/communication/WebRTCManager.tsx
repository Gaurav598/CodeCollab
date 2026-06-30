import React, { useEffect, useRef } from 'react';
import { useWebRTCStore } from '@/store/webrtcStore';
import { stompService } from '@/services/stompClient';
import { useAuthStore } from '@/store/authStore';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff } from 'lucide-react';

interface WebRTCManagerProps {
    roomId: string;
    users?: import('@/hooks/useAwareness').UserAwareness[];
    userRole?: string;
}

function VideoTile({
    stream,
    muted,
    label,
    forceVideoOff,
}: {
    stream: MediaStream | null;
    muted?: boolean;
    label: string;
    forceVideoOff?: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isRemoteVideoOff, setIsRemoteVideoOff] = React.useState(false);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }

        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                setIsRemoteVideoOff(videoTrack.muted || !videoTrack.enabled);
                const handleMute = () => setIsRemoteVideoOff(true);
                const handleUnmute = () => setIsRemoteVideoOff(false);
                videoTrack.addEventListener('mute', handleMute);
                videoTrack.addEventListener('unmute', handleUnmute);
                return () => {
                    videoTrack.removeEventListener('mute', handleMute);
                    videoTrack.removeEventListener('unmute', handleUnmute);
                }
            } else {
                setIsRemoteVideoOff(true);
            }
        } else {
            setIsRemoteVideoOff(true);
        }
    }, [stream]);

    const showDummy = forceVideoOff !== undefined ? forceVideoOff : isRemoteVideoOff;

    return (
        <div className="relative rounded-xl overflow-hidden bg-muted border border-border aspect-video w-full shadow-md">
            {!showDummy && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className="w-full h-full object-cover bg-background"
                />
            )}
            {showDummy && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-sm border border-border">
                            <VideoOff className="text-muted-foreground w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Camera off</span>
                    </div>
                </div>
            )}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="bg-background/90 border border-border backdrop-blur-sm px-2 py-0.5 rounded-md text-xs text-foreground font-medium shadow-sm">
                    {label}
                </span>
            </div>
        </div>
    );
}

export function WebRTCManager({ roomId, users, userRole }: WebRTCManagerProps) {
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

    const [warningMessage, setWarningMessage] = React.useState<string | null>(null);
    const remoteVideoStates = useWebRTCStore(state => state.remoteVideoStates);

    // Initialize local stream just to get permission, then stop it immediately
    useEffect(() => {
        let isMounted = true;
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                // Immediately stop hardware to turn off lights, just wanted permission
                stream.getTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                });
                if (isMounted) {
                    setLocalStream(new MediaStream());
                }
            })
            .catch(err => {
                console.error("Could not get media", err);
                if (isMounted) {
                    setLocalStream(new MediaStream());
                }
            });

        return () => {
            isMounted = false;
        };
    }, [setLocalStream]);

    // Broadcast local mute state whenever it changes
    useEffect(() => {
        if (!currentUser?.id) return;
        stompService.publish(`/topic/room.${roomId}.video.presence`, {
            type: 'VIDEO_STATE',
            userId: currentUser.id,
            isVideoMuted
        });
    }, [isVideoMuted, roomId, currentUser?.id]);

    const remoteEntries = Object.entries(remoteStreams);

    const handleStartScreenShare = async () => {
        if (userRole === 'viewer') {
            setWarningMessage("Viewers are not allowed to share their screen.");
            setTimeout(() => setWarningMessage(null), 4000);
            return;
        }
        if (useWebRTCStore.getState().isRemoteScreenSharing) {
            setWarningMessage("Someone else is already sharing their screen!");
            setTimeout(() => setWarningMessage(null), 4000);
            return;
        }
        await startScreenShare(() => {
            stompService.publish(`/topic/room.${roomId}.video.presence`, { type: 'SCREEN_SHARE_STOP', userId: currentUser?.id });
        });
        stompService.publish(`/topic/room.${roomId}.video.presence`, { type: 'SCREEN_SHARE_START', userId: currentUser?.id });
    };

    const handleStopScreenShare = async () => {
        await stopScreenShare();
        stompService.publish(`/topic/room.${roomId}.video.presence`, { type: 'SCREEN_SHARE_STOP', userId: currentUser?.id });
    };

    return (
        <div className="flex flex-col gap-4 h-full relative">
            {warningMessage && (
                <div className="w-full px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md shadow-sm text-xs font-medium text-center mb-1">
                    {warningMessage}
                </div>
            )}
            {/* Video Grid */}
            <div className={`grid grid-cols-1 gap-3`}>
                <VideoTile
                    stream={localStream}
                    muted
                    label={`You${isAudioMuted ? ' 🔇' : ''}`}
                    forceVideoOff={isVideoMuted}
                />
                {remoteEntries.map(([userId, stream]) => {
                    const user = users?.find(u => u.id === userId);
                    const displayName = user?.name || `User ${userId.substring(0, 6)}`;
                    return (
                        <VideoTile
                            key={userId}
                            stream={stream}
                            label={displayName}
                            forceVideoOff={remoteVideoStates[userId]}
                        />
                    );
                })}
            </div>

            {/* Self-only Controls */}
            <div className="flex justify-center gap-3 pt-2">
                {/* Mic toggle — controls only YOUR microphone */}
                <button
                    onClick={toggleAudio}
                    title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
                    className={`p-3 rounded-full transition-all shadow-md border ${
                        isAudioMuted
                            ? 'bg-red-500 hover:bg-red-600 border-red-600 text-white'
                            : 'bg-muted hover:bg-muted/80 text-foreground border-border'
                    }`}
                >
                    {isAudioMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Camera toggle — controls only YOUR camera */}
                <button
                    onClick={toggleVideo}
                    title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
                    className={`p-3 rounded-full transition-all shadow-md border ${
                        isVideoMuted
                            ? 'bg-red-500 hover:bg-red-600 border-red-600 text-white'
                            : 'bg-muted hover:bg-muted/80 text-foreground border-border'
                    }`}
                >
                    {isVideoMuted ? <VideoOff size={18} /> : <Video size={18} />}
                </button>

                {/* Screen share — controls only YOUR screen */}
                <button
                    onClick={isScreenSharing ? handleStopScreenShare : handleStartScreenShare}
                    title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
                    className={`p-3 rounded-full transition-all shadow-md border ${
                        isScreenSharing
                            ? 'bg-blue-500 hover:bg-blue-600 border-blue-600 text-white'
                            : 'bg-muted hover:bg-muted/80 text-foreground border-border'
                    }`}
                >
                    <MonitorUp size={18} />
                </button>
            </div>

            <p className="text-center text-xs text-muted-foreground pb-1 font-medium px-4 leading-relaxed">
                You control only your own microphone, camera, and screen.
            </p>
        </div>
    );
}
