"use client";

import { useState } from "react";
import { Bot, MessageSquare, Video } from "lucide-react";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { ChatPanel } from "@/components/communication/ChatPanel";
import { WebRTCManager } from "@/components/communication/WebRTCManager";
import { TabData } from "@/store/workspaceStore";

interface WorkspaceRightPanelProps {
  roomId: string;
  activeFile: TabData | undefined;
  openFiles: TabData[];
  getCode: () => string;
  getSelection: () => string;
  applyPreview: (code: string) => void;
}

type PanelTab = "ai" | "chat" | "video";

export function WorkspaceRightPanel(props: WorkspaceRightPanelProps) {
  const [tab, setTab] = useState<PanelTab>("ai");

  return (
    <div className="hidden h-full w-[380px] min-w-[340px] max-w-[420px] border-l border-border bg-background xl:flex xl:flex-col">
      <div className="grid h-11 grid-cols-3 border-b border-border bg-muted/20">
        <PanelButton active={tab === "ai"} label="AI" icon={<Bot size={15} />} onClick={() => setTab("ai")} />
        <PanelButton active={tab === "chat"} label="Chat" icon={<MessageSquare size={15} />} onClick={() => setTab("chat")} />
        <PanelButton active={tab === "video"} label="Video" icon={<Video size={15} />} onClick={() => setTab("video")} />
      </div>
      <div className="min-h-0 flex-1">
        {tab === "ai" && <AIAssistantPanel {...props} />}
        {tab === "chat" && <ChatPanel roomId={props.roomId} />}
        {tab === "video" && (
          <div className="h-full overflow-y-auto p-3">
            <WebRTCManager roomId={props.roomId} />
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
      className={`inline-flex items-center justify-center gap-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary ${
        active ? "bg-background text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
