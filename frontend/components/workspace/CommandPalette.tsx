"use client";

import { useEffect, useMemo, useState } from "react";
import { FileCode, FolderOpen, Play, Search, Settings, Sparkles, TerminalSquare, X } from "lucide-react";
import { Project } from "@/services/workspaceService";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface CommandPaletteProps {
  projects: Project[];
  roomCode: string;
  onRunCode: () => void;
  onFocusAi: () => void;
}

export function CommandPalette({ projects, roomCode, onRunCode, onFocusAi }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { openTab, setActiveProject } = useWorkspaceStore();

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
    const fileItems = projects.flatMap((project) =>
      project.files
        .filter((file) => !file.path.endsWith(".gitkeep"))
        .map((file) => ({
          id: `file-${file.id}`,
          label: file.path,
          detail: project.name,
          icon: <FileCode size={16} />,
          run: () => {
            setActiveProject(project.id);
            openTab({ id: file.id, projectId: project.id, path: file.path, language: file.language });
          },
        }))
    );
    const projectItems = projects.map((project) => ({
      id: `project-${project.id}`,
      label: project.name,
      detail: `Project in ${roomCode}`,
      icon: <FolderOpen size={16} />,
      run: () => setActiveProject(project.id),
    }));
    const commandItems = [
      { id: "run", label: "Run active file", detail: "Execution panel", icon: <Play size={16} />, run: onRunCode },
      { id: "ai", label: "Focus AI assistant", detail: "AI actions and chat", icon: <Sparkles size={16} />, run: onFocusAi },
      { id: "terminal", label: "Show execution output", detail: "Workspace panel", icon: <TerminalSquare size={16} />, run: onRunCode },
      { id: "settings", label: "Room settings", detail: "Members and permissions", icon: <Settings size={16} />, run: () => undefined },
    ];
    return [...commandItems, ...projectItems, ...fileItems];
  }, [projects, roomCode, onRunCode, onFocusAi, openTab, setActiveProject]);

  const filtered = items
    .filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 12);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-background/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="mx-auto mt-[10vh] w-full max-w-2xl overflow-hidden rounded border border-border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search size={18} className="text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files, projects, commands, actions..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close command palette"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                item.run();
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center gap-3 rounded px-3 py-2 text-left transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <span className="text-muted-foreground">{item.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No matches</div>
          )}
        </div>
      </div>
    </div>
  );
}
