"use client";

import { useWorkspaceStore } from "@/store/workspaceStore";
import { X } from "lucide-react";

export function Tabs() {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useWorkspaceStore();

  if (openTabs.length === 0) {
    return <div className="flex h-full min-w-0 flex-1 items-center px-1 text-sm italic text-muted-foreground">No open files</div>;
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
            className={`flex min-w-[130px] max-w-[220px] cursor-pointer items-center justify-between border-r border-border px-5 transition-all duration-200 group relative ${
              isActive 
                ? 'bg-muted/30 border-b-2 border-b-primary text-foreground font-medium' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <span className="text-[13px] mr-4 truncate">{filename}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className={`p-1 rounded-md transition-all duration-300 hover:bg-red-500/10 hover:text-red-500 hover:rotate-90 hover:scale-110 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <X size={14} className="transition-transform duration-300" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
