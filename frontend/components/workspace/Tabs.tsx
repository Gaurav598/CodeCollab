"use client";

import { useWorkspaceStore } from "@/store/workspaceStore";
import { X } from "lucide-react";

export function Tabs() {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useWorkspaceStore();

  if (openTabs.length === 0) {
    return <div className="flex h-full min-w-0 flex-1 items-center px-1 text-sm italic text-muted-foreground">No open files</div>;
  }

  return (
    <div className="flex h-full min-w-0 flex-1 overflow-x-auto">
      {openTabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const filename = tab.path.split('/').pop();
        
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex min-w-fit cursor-pointer items-center border-r border-border px-4 transition-colors group ${
              isActive 
                ? 'bg-muted/40 border-b-2 border-b-primary text-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <span className="text-sm mr-2">{filename}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className={`p-0.5 rounded-sm hover:bg-muted-foreground/20 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
