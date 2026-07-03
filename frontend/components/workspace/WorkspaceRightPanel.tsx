"use client";

import { useState } from "react";
import { MessageSquare, Video, VideoOff } from "lucide-react";
import { ChatPanel } from "@/components/communication/ChatPanel";
import { WebRTCManager } from "@/components/communication/WebRTCManager";
import { TabData } from "@/store/workspaceStore";
import { UserAwareness } from "@/hooks/useAwareness";

interface WorkspaceRightPanelProps {
  roomId: string;
  userRole?: string;
  users: UserAwareness[];
  activeFile: TabData | undefined;
  openFiles: TabData[];
  getCode: () => string;
  getSelection: () => string;
  applyPreview: (code: string) => void;
}

type PanelTab = "chat" | "video";

export function WorkspaceRightPanel(props: WorkspaceRightPanelProps) {
  const [tab, setTab] = useState<PanelTab>("chat");

  return (
    <div className="hidden h-full w-[300px] min-w-[280px] max-w-[360px] border-l border-border bg-background xl:flex xl:flex-col">
      <div className="grid h-11 grid-cols-2 border-b border-border bg-background">
        <PanelButton active={tab === "chat"} label="Chat" icon={<MessageSquare size={15} />} onClick={() => setTab("chat")} />
        <PanelButton active={tab === "video"} label="Video" icon={<Video size={15} />} onClick={() => setTab("video")} />
      </div>
      <div className="min-h-0 flex-1">
        {tab === "chat" && <ChatPanel roomId={props.roomId} userRole={props.userRole} />}
        {tab === "video" && (
          <div className="h-full overflow-y-auto p-3">
            {props.userRole === 'viewer' ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4 mt-10">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner border border-primary/20">
                  <VideoOff size={32} />
                </div>
                <h3 className="text-lg font-bold text-foreground tracking-wide">Viewer Restricted</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You currently have <span className="font-semibold text-foreground">Viewer</span> access. Video and voice features are restricted.
                </p>
                <div className="bg-muted/50 p-3 rounded-md border border-border shadow-sm text-xs text-muted-foreground mt-4 w-full">
                  Please ask the room owner in the chat to upgrade your role to <span className="font-semibold text-foreground">Editor</span> to access the call.
                </div>
              </div>
            ) : (
              <WebRTCManager roomId={props.roomId} users={props.users} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PanelButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center justify-center gap-1.5 text-[13px] font-medium transition focus:outline-none border-b-2 ${
        active ? "bg-background text-foreground border-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
