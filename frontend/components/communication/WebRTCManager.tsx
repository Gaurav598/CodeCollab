import React, { useEffect, useRef } from 'react';
import { useWebRTCStore } from '@/store/webrtcStore';
import { stompService } from '@/services/stompClient';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Mic, MicOff, Video, VideoOff, MonitorUp, Lock, ShieldAlert, Pin } from 'lucide-react';
import { canUseMedia } from '@/utils/permissions';

function useAudioActivity(stream: MediaStream | null, isMuted: boolean) {
    const [isSpeaking, setIsSpeaking] = React.useState(false);

    React.useEffect(() => {
        if (!stream || isMuted) {
            setIsSpeaking(false);
            return;
        }

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0 || !audioTracks[0].enabled || audioTracks[0].muted) {
            setIsSpeaking(false);
            return;
        }

        let audioContext: AudioContext;
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            return;
        }
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        let source: MediaStreamAudioSourceNode;
        try {
            source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
        } catch (err) {
            console.warn("Failed to create audio source for VAD", err);
            return;
        }

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let animationFrame: number;
        let speakFrames = 0;

        const checkAudio = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            
            if (average > 10) {
                speakFrames = 5;
                setIsSpeaking(true);
            } else {
                if (speakFrames > 0) {
                    speakFrames--;
                } else {
                    setIsSpeaking(false);
                }
            }
            animationFrame = requestAnimationFrame(checkAudio);
        };
        checkAudio();

        return () => {
            cancelAnimationFrame(animationFrame);
            try {
                source.disconnect();
                audioContext.close();
            } catch (e) {}
        };
    }, [stream, isMuted]);

    return isSpeaking;
}

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
    forceAudioOff,
    isLocal,
    isPinned,
    onPin,
}: {
    stream: MediaStream | null;
    muted?: boolean;
    label: string;
    forceVideoOff?: boolean;
    forceAudioOff?: boolean;
    isLocal?: boolean;
    isPinned?: boolean;
    onPin?: () => void;
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
    const isMicOn = forceAudioOff === false; // Explictly false means mic is ON
    const isSpeaking = useAudioActivity(stream, forceAudioOff || false);

    let borderClasses = "border-border shadow-md";
    if (isMicOn) {
        if (isSpeaking) {
            if (showDummy) {
                // Heavy animation when camera is off
                borderClasses = "border-primary ring-4 ring-primary/40 shadow-[0_0_25px_rgba(var(--primary),0.6)] animate-pulse transition-all duration-75";
            } else {
                // Subtle border when camera is on
                borderClasses = "border-primary ring-2 ring-primary/50 transition-all duration-75";
            }
        } else {
            if (showDummy) {
                borderClasses = "border-primary/80 ring-2 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all duration-300";
            } else {
                borderClasses = "border-transparent transition-all duration-300";
            }
        }
    }

    return (
        <div className={`relative rounded-xl overflow-hidden bg-muted border aspect-video w-full ${borderClasses}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className={`w-full h-full object-cover bg-background scale-x-[-1] ${showDummy ? 'opacity-0' : 'opacity-100'}`}
            />
            {onPin && (
                <div className="absolute top-2 right-2 z-20">
                    <button 
                        onClick={onPin}
                        title={isPinned ? "Unpin video" : "Pin video"}
                        className={`p-1.5 rounded-full transition-all backdrop-blur-md border shadow-sm ${
                            isPinned 
                            ? 'bg-primary/90 border-primary text-primary-foreground' 
                            : 'bg-background/40 hover:bg-background/70 border-white/10 text-white/70 hover:text-white'
                        }`}
                    >
                        <Pin size={14} className={isPinned ? "fill-current" : ""} />
                    </button>
                </div>
            )}
            {showDummy && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background overflow-hidden group z-0">
                    {/* Animated background blobs for the dummy video */}
                    <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-primary/10 rounded-full blur-[40px] animate-[pulse_6s_ease-in-out_infinite]"></div>
                    <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[40px] animate-[pulse_5s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}></div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-3 transform transition-transform duration-500 group-hover:scale-105">
                        <div className="relative w-16 h-16 rounded-full bg-background/60 backdrop-blur-xl flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 transition-colors">
                            {/* Inner rotating dashed ring */}
                            <div className="absolute inset-1.5 rounded-full border border-dashed border-white/20 animate-[spin_10s_linear_infinite]"></div>
                            <VideoOff className="text-gray-400 w-6 h-6 drop-shadow-md relative z-10" />
                        </div>
                        <div className="bg-background/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] text-gray-300 font-medium shadow-inner border border-white/5 tracking-wide">
                            {forceAudioOff ? "Camera & Mic off" : "Camera off"}
                        </div>
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
    const remoteAudioStates = useWebRTCStore(state => state.remoteAudioStates);
    const [pinnedTileId, setPinnedTileId] = React.useState<string | null>(null);

    // Initialize dummy local stream so PeerConnections always negotiate sendrecv
    useEffect(() => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1; canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, 1, 1); }
            const videoStream = canvas.captureStream(1);
            
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx();
            const dest = audioCtx.createMediaStreamDestination();
            
            setLocalStream(new MediaStream([
                dest.stream.getAudioTracks()[0],
                videoStream.getVideoTracks()[0]
            ]));
        } catch (e) {
            setLocalStream(new MediaStream());
        }
    }, [setLocalStream]);

    // Broadcast local media state whenever it changes
    useEffect(() => {
        if (!currentUser?.id) return;
        stompService.publish(`/topic/room.${roomId}.video.presence`, {
            type: 'MEDIA_STATE',
            userId: currentUser.id,
            isVideoMuted,
            isAudioMuted
        });
    }, [isVideoMuted, isAudioMuted, roomId, currentUser?.id]);

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

    // Render video tiles for ALL online users (from Yjs awareness) who have editor/owner permissions
    // This ensures users who join with camera/mic off still get a tile!
    const onlineRemoteMediaUsers = (users || []).filter(u => {
        if (u.id === currentUser?.id) return false;
        const member = roomMembers.find(m => m.userId === u.id);
        if (!member) return false;
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
            {canUseMedia(userRole || 'editor') && (
                <div className={`grid grid-cols-1 gap-3`}>
                    {[
                        {
                            id: 'local',
                            stream: localStream,
                            muted: true,
                            label: currentUser?.username || "You",
                            forceVideoOff: isVideoMuted,
                            forceAudioOff: isAudioMuted,
                            isLocal: true,
                        },
                        ...onlineRemoteMediaUsers.map((user) => {
                            const stream = remoteStreams[user.id];
                            const displayName = user.name || `User ${user.id.substring(0, 6)}`;
                            const isVideoOff = !stream || remoteVideoStates[user.id] !== false; 
                            const isAudioOff = !stream || remoteAudioStates[user.id] !== false;
                            return {
                                id: user.id,
                                stream: stream || new MediaStream(),
                                muted: remoteAudioStates[user.id] ?? false,
                                label: displayName,
                                forceVideoOff: isVideoOff,
                                forceAudioOff: isAudioOff,
                                isLocal: false,
                            };
                        })
                    ].sort((a, b) => {
                        if (a.id === pinnedTileId) return -1;
                        if (b.id === pinnedTileId) return 1;
                        if (a.isLocal) return -1;
                        if (b.isLocal) return 1;
                        return 0;
                    }).map(tile => (
                        <VideoTile
                            key={tile.id}
                            stream={tile.stream}
                            muted={tile.muted}
                            label={tile.label}
                            forceVideoOff={tile.forceVideoOff}
                            forceAudioOff={tile.forceAudioOff}
                            isLocal={tile.isLocal}
                            isPinned={pinnedTileId === tile.id}
                            onPin={() => setPinnedTileId(pinnedTileId === tile.id ? null : tile.id)}
                        />
                    ))}
                </div>
            )}
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
