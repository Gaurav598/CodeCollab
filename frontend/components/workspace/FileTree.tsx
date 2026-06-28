"use client";

import { useState, useEffect } from "react";
import { Project, FileEntry, createFile, renameFile, deleteFile } from "@/services/workspaceService";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useModalStore } from "@/store/modalStore";
import { FileCode, MoreVertical, Plus } from "lucide-react";

function Node({ file, project, userRole, onFileChange, onContextMenu }: { 
  file: FileEntry, 
  project: Project,
  userRole: string,
  onFileChange: () => void,
  onContextMenu: (e: React.MouseEvent, file: FileEntry) => void
}) {
  const { openTab, activeTabId } = useWorkspaceStore();

  const handleClick = () => {
    openTab({
      id: file.id,
      projectId: project.id,
      path: file.path,
      language: file.language,
    });
  };

  const isActive = activeTabId === file.id;

  return (
    <div
      className={`flex items-center px-4 py-1.5 cursor-pointer text-[13px] transition-colors group ${
        isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      }`}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, file)}
    >
      <span className="mr-2 opacity-80">
        <FileCode size={15} />
      </span>
      <span className="truncate flex-1">{file.path}</span>
      
      {(userRole === "owner" || userRole === "editor") && (
        <button 
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-muted-foreground/20 ml-2"
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e, file);
          }}
        >
          <MoreVertical size={14} />
        </button>
      )}
    </div>
  );
}

export function FileTree({ project, userRole, onFileChange }: { project: Project, userRole: string, onFileChange: () => void }) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: FileEntry | null;
  } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, file: FileEntry | null) => {
    e.preventDefault();
    if (userRole !== "owner" && userRole !== "editor") return;
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleCreateFile = async () => {
    const name = await useModalStore.getState().showPrompt("File name:", "", "Enter the name of the new file.");
    if (!name) return;
    
    const language = "javascript";

    try {
      await createFile(project.id, name, language);
      onFileChange();
    } catch (err: any) {
      useModalStore.getState().showAlert("Error", err.message);
    }
  };

  const handleRename = async (file: FileEntry) => {
    const newName = await useModalStore.getState().showPrompt("New name:", file.path, "Enter the new name.");
    if (!newName || newName === file.path) return;

    try {
      await renameFile(file.id, newName);
      useWorkspaceStore.getState().updateTabPath(file.id, newName);
      onFileChange();
    } catch (err: any) {
      useModalStore.getState().showAlert("Error", err.message);
    }
  };

  const handleDelete = async (file: FileEntry) => {
    const confirmed = await useModalStore.getState().showConfirm("Delete", `Are you sure you want to delete ${file.path}?`);
    if (!confirmed) return;

    try {
      await deleteFile(file.id);
      onFileChange();
    } catch (err: any) {
      useModalStore.getState().showAlert("Error", err.message);
    }
  };

  // Filter out any lingering .gitkeep files that might have been used for folders previously
  const files = project.files
    .filter(f => !f.path.endsWith('.gitkeep'))
    .sort((a, b) => a.path.localeCompare(b.path));

  return (
    <div className="relative h-full" onContextMenu={(e) => handleContextMenu(e, null)}>
      <div className="flex items-center justify-between px-4 py-2 group">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">File Manager</span>
        {(userRole === "owner" || userRole === "editor") && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCreateFile} className="text-muted-foreground hover:text-foreground p-1" title="New File">
              <Plus size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-1 pb-20">
        {files.map(file => (
          <Node 
            key={file.id} 
            file={file} 
            project={project} 
            userRole={userRole} 
            onFileChange={onFileChange} 
            onContextMenu={handleContextMenu}
          />
        ))}
        {files.length === 0 && (
          <div className="px-4 py-4 text-sm text-muted-foreground italic text-center">
            Workspace is empty.
            <br/>Right-click to create a file.
          </div>
        )}
      </div>

      {contextMenu && (
        <div 
          className="fixed z-50 bg-card border border-border shadow-lg rounded-md py-1 min-w-[150px] text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.file ? (
            <>
              <button className="w-full text-left px-4 py-1.5 hover:bg-muted" onClick={() => { handleRename(contextMenu.file!); setContextMenu(null); }}>Rename</button>
              <button className="w-full text-left px-4 py-1.5 hover:bg-destructive hover:text-destructive-foreground text-red-500" onClick={() => { handleDelete(contextMenu.file!); setContextMenu(null); }}>Delete</button>
            </>
          ) : (
            <button className="w-full text-left px-4 py-1.5 hover:bg-muted" onClick={() => { handleCreateFile(); setContextMenu(null); }}>New File</button>
          )}
        </div>
      )}
    </div>
  );
}
