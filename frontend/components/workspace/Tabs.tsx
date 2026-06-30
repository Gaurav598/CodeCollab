"use client";

import { useWorkspaceStore } from "@/store/workspaceStore";
import { X } from "lucide-react";
import { FileIcon } from "./FileIcon";

export function Tabs() {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useWorkspaceStore();

  if (openTabs.length === 0) {
    return <div className="flex h-full min-w-0 flex-1 items-center px-4 text-sm italic text-muted-foreground">No open files</div>;
  }

  return (
    <div className="flex h-full min-w-0 flex-1 overflow-x-auto scrollbar-hide">
      {openTabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const filename = tab.path.split('/').pop();
        
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex min-w-[130px] max-w-[220px] cursor-pointer items-center justify-between border-r border-border px-4 transition-all duration-200 group relative ${
              isActive 
                ? 'bg-muted/30 text-foreground font-medium' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_-2px_10px_rgba(59,130,246,0.6)] z-10" />
            )}
            <div className="flex items-center gap-2.5 overflow-hidden mr-2">
              <FileIcon name={filename || ""} size={14} className="shrink-0 drop-shadow-sm opacity-90" />
              <span className="text-[13px] truncate">{filename}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className={`p-1 rounded-md transition-all duration-300 hover:bg-red-500/10 hover:text-red-500 hover:rotate-90 hover:scale-110 shrink-0 ${isActive ? 'opacity-100 text-muted-foreground' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <X size={14} className="transition-transform duration-300" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
