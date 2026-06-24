"use client";

import { useEffect, useState } from "react";
import { getRoomProjects, Project, createProject } from "@/services/workspaceService";
import { FileTree } from "./FileTree";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { ChevronDown, Plus, Settings } from "lucide-react";

import { RoomSettings } from "./RoomSettings";

export function Sidebar({ roomCode, userRole }: { roomCode: string, userRole: string }) {
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
      setProjects(data);
      if (data.length > 0 && !activeProjectId) {
        setActiveProject(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject() {
    const name = prompt("Project Name:");
    if (name) {
      const newProj = await createProject(roomCode, name);
      setProjects([...projects, newProj]);
      setActiveProject(newProj.id);
    }
  }

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <>
    <div className="w-[250px] min-w-[250px] border-r border-border bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm truncate">Room: {roomCode}</h2>
        <button onClick={() => setShowSettings(true)} className="text-muted-foreground hover:text-foreground">
          <Settings size={16} />
        </button>
      </div>

      <div className="p-2 border-b border-border">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects</span>
          {(userRole === "owner" || userRole === "editor") && (
            <button onClick={handleCreateProject} className="text-muted-foreground hover:text-foreground">
              <Plus size={14} />
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="px-2 py-1 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <select 
            value={activeProjectId || ""} 
            onChange={(e) => setActiveProject(e.target.value)}
            className="w-full mt-1 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {activeProject ? (
          <FileTree project={activeProject} userRole={userRole} onFileChange={fetchProjects} />
        ) : (
          <div className="px-4 py-2 text-sm text-muted-foreground">No project selected.</div>
        )}
      </div>
    </div>
    {showSettings && <RoomSettings roomCode={roomCode} onClose={() => setShowSettings(false)} />}
    </>
  );
}
