"use client";

import { useEffect, useMemo, useState } from "react";
import { FileCode, FolderOpen, Play, Search, Settings, Sparkles, TerminalSquare, X } from "lucide-react";
import { FileEntry } from "@/services/workspaceService";
import { useWorkspaceStore } from "@/store/workspaceStore";

import { FileIcon } from "./FileIcon";

interface CommandPaletteProps {
  files: FileEntry[];
  roomCode: string;
  onRunCode: () => void;
  onFocusAi: () => void;
}

export function CommandPalette({ files, roomCode, onRunCode, onFocusAi }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { openTab } = useWorkspaceStore();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const items = useMemo(() => {
    const fileItems = files
      .filter((file) => !file.path.endsWith(".gitkeep"))
      .map((file) => ({
        id: `file-${file.id}`,
        label: file.path,
        detail: `File in ${roomCode}`,
        icon: <FileIcon name={file.path} size={16} />,
        run: () => {
          openTab({ id: file.id, path: file.path, language: file.language });
        },
      }));
    const commandItems = [
      { id: "run", label: "Run active file", detail: "Execution panel", icon: <Play size={16} className="text-green-500" />, run: onRunCode },
      { id: "ai", label: "Focus AI assistant", detail: "AI actions and chat", icon: <Sparkles size={16} className="text-purple-500" />, run: onFocusAi },
      { id: "terminal", label: "Show execution output", detail: "Workspace panel", icon: <TerminalSquare size={16} className="text-blue-500" />, run: onRunCode },
      { id: "settings", label: "Room settings", detail: "Members and permissions", icon: <Settings size={16} className="text-slate-500" />, run: () => undefined },
    ];
    return [...commandItems, ...fileItems];
  }, [files, roomCode, onRunCode, onFocusAi, openTab]);

  const filtered = items
    .filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 12);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 p-4 backdrop-blur-md flex items-start justify-center pt-[15vh]" role="dialog" aria-modal="true" aria-label="Command palette" onClick={() => setOpen(false)}>
      <div 
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl ring-1 ring-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-4 bg-muted/20">
          <Search size={20} className="text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files, projects, commands..."
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground font-medium"
          />
          <div className="flex items-center gap-1.5 opacity-50">
            <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-sans font-medium border border-border/50 shadow-sm">⌘</kbd>
            <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-sans font-medium border border-border/50 shadow-sm">K</kbd>
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                item.run();
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 hover:bg-primary/10 hover:translate-x-1 focus:outline-none focus:bg-primary/10 group"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/50 border border-border/50 group-hover:bg-background group-hover:border-primary/20 group-hover:shadow-sm transition-all">
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                <span className="block truncate text-[11px] font-medium text-muted-foreground">{item.detail}</span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">No matches found for "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}
