import React, { useEffect, useRef } from 'react';
import { useWebRTCStore } from '@/store/webrtcStore';
import { stompService } from '@/services/stompClient';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Mic, MicOff, Video, VideoOff, MonitorUp, Lock, ShieldAlert } from 'lucide-react';
import { canUseMedia } from '@/utils/permissions';

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

    const currentUser = useAuthStore(state => state.user);
    const roomMembers = useWorkspaceStore(state => state.roomMembers);
    const [warningMessage, setWarningMessage] = React.useState<string | null>(null);
    const remoteVideoStates = useWebRTCStore(state => state.remoteVideoStates);

    // Initialize an empty local stream so the VideoTile and PeerConnections have a reference
    useEffect(() => {
        setLocalStream(new MediaStream());
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

    // Handle instant role downgrade to viewer
    useEffect(() => {
        if (!canUseMedia(userRole || 'editor')) {
            if (!isAudioMuted) toggleAudio();
            if (!isVideoMuted) toggleVideo();
            if (isScreenSharing) {
                stopScreenShare();
                stompService.publish(`/topic/room.${roomId}.video.presence`, { type: 'SCREEN_SHARE_STOP', userId: currentUser?.id });
            }
        }
    }, [userRole]);

    // Filter remote streams to ONLY include users who have editor/owner permissions
    // Viewers should not be visible in the video grid at all.
    const remoteEntries = Object.entries(remoteStreams).filter(([userId]) => {
        const member = roomMembers.find(m => m.userId === userId);
        if (!member) return false; // DON'T SHOW UNKNOWN MEMBERS
        return canUseMedia(member.role);
    });

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
                {canUseMedia(userRole || 'editor') && (
                    <VideoTile
                        stream={localStream}
                        muted
                        label={`You${isAudioMuted ? ' 🔇' : ''}`}
                        forceVideoOff={isVideoMuted}
                    />
                )}
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

            {/* Controls or Permission Panel */}
            {!canUseMedia(userRole || 'editor') ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 relative overflow-hidden group transition-all duration-700 ease-out bg-[#0f111a] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                   {/* 3D animated background blobs - More lively and colorful */}
                   <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/30 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3 animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
                   <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 animate-[pulse_5s_cubic-bezier(0.4,0,0.6,1)_infinite]" style={{ animationDelay: '1.5s' }}></div>
                   <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -translate-y-1/2 -translate-x-1/2 animate-[ping_6s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                   
                   <div className="relative z-10 flex flex-col items-center text-center transform transition-transform duration-500 group-hover:scale-[1.02]">
                       {/* Floating 3D Icon */}
                       <div className="w-20 h-20 rounded-[1.2rem] bg-gradient-to-br from-primary/40 via-primary/10 to-transparent flex items-center justify-center mb-6 shadow-[0_10px_40px_rgba(var(--primary),0.4)] border border-primary/30 backdrop-blur-xl animate-[bounce_3.5s_ease-in-out_infinite] transform-gpu preserve-3d group-hover:rotate-y-12 transition-transform">
                           <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-[1.2rem]"></div>
                           <ShieldAlert className="w-10 h-10 text-primary drop-shadow-[0_2px_10px_rgba(var(--primary),0.8)]" />
                       </div>
                       
                       <h3 className="text-2xl font-black text-white mb-4 tracking-tight drop-shadow-md">
                           Viewer Restricted
                       </h3>
                       
                       <div className="bg-background/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-inner mb-6 max-w-[260px]">
                           <p className="text-[13px] text-gray-300 leading-relaxed font-medium">
                               You currently have <span className="text-white font-bold">Viewer</span> access.
                           </p>
                           <div className="h-[1px] w-full bg-white/10 my-3"></div>
                           <p className="text-[12px] text-gray-400">
                               <span className="text-red-400 font-semibold">Camera</span>, <span className="text-orange-400 font-semibold">Microphone</span>, and <span className="text-blue-400 font-semibold">Screen Share</span> are disabled.
                           </p>
                       </div>
                       
                       <div className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 shadow-lg transition-colors cursor-default">
                           <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></div>
                           <p className="text-xs text-gray-200 font-bold uppercase tracking-widest">
                               Waiting for promotion
                           </p>
                       </div>
                   </div>
                </div>
            ) : (
                <div className="flex justify-center gap-3 pt-2 bg-background p-3 rounded-lg border border-border shadow-sm mt-auto">
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
            )}

            {canUseMedia(userRole || 'editor') && (
                <p className="text-center text-[10px] text-muted-foreground/70 font-medium px-4 pb-1">
                    You control only your own media.
                </p>
            )}
        </div>
    );
}
