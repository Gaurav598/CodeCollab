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
          <div className="h-full overflow-y-auto p-3 flex flex-col">
             <WebRTCManager roomId={props.roomId} users={props.users} userRole={props.userRole} />
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
