"use client";

import { useWorkspaceStore } from "@/store/workspaceStore";
import { X } from "lucide-react";

export function Tabs() {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useWorkspaceStore();

  if (openTabs.length === 0) {
    return <div className="h-10 border-b border-border bg-muted/10 flex items-center px-4 text-sm text-muted-foreground italic">No open files</div>;
  }

  return (
    <div className="h-10 border-b border-border bg-muted/10 flex overflow-x-auto">
      {openTabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const filename = tab.path.split('/').pop();
        
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 border-r border-border cursor-pointer min-w-fit transition-colors group ${
              isActive 
                ? 'bg-background border-b-2 border-b-primary text-foreground' 
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
