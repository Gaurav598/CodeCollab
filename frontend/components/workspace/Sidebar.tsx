"use client";

import { useEffect, useState } from "react";
import { getRoomProjects, Project, createProject } from "@/services/workspaceService";
import { FileTree } from "./FileTree";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { ChevronDown, Plus, Settings } from "lucide-react";

import { RoomSettings } from "./RoomSettings";

export function Sidebar({ roomCode, userRole, onProjectsLoaded }: { roomCode: string, userRole: string, onProjectsLoaded?: (projects: Project[]) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const { activeProjectId, setActiveProject } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [roomCode]);

  async function fetchProjects() {
    try {
      const data = await getRoomProjects(roomCode);
      if (data.length === 0 && (userRole === "owner" || userRole === "editor")) {
        const defaultProj = await createProject(roomCode, "Files");
        setProjects([defaultProj]);
        setActiveProject(defaultProj.id);
        onProjectsLoaded?.([defaultProj]);
      } else {
        setProjects(data);
        if (data.length > 0 && !activeProjectId) {
          setActiveProject(data[0].id);
        }
        onProjectsLoaded?.(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <>
    <div className="w-[200px] min-w-[200px] border-r border-border bg-muted/30 flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex-shrink-0 flex items-center justify-center text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 18l6-6-6-6" />
              <path d="M8 6l-6 6 6 6" />
            </svg>
          </div>
          <h2 className="font-semibold text-[13px] truncate tracking-wider text-muted-foreground">ROOM: {roomCode}</h2>
        </div>
        <button onClick={() => setShowSettings(true)} className="text-muted-foreground hover:text-foreground shrink-0 ml-2">
          <Settings size={15} />
        </button>
      </div>


      <div className="flex-1 overflow-y-auto py-2">
        {activeProject ? (
          <FileTree project={activeProject} userRole={userRole} onFileChange={fetchProjects} />
        ) : (
          <div className="px-4 py-2 text-sm text-muted-foreground">No project selected.</div>
        )}
      </div>
    </div>
    {showSettings && <RoomSettings roomCode={roomCode} userRole={userRole} onClose={() => setShowSettings(false)} />}
    </>
  );
}
