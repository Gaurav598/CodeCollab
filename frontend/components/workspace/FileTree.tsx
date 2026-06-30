"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FileEntry, createFile, renameFile, deleteFile } from "@/services/workspaceService";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useModalStore } from "@/store/modalStore";
import { MoreVertical, Plus } from "lucide-react";
import { FileIcon } from "./FileIcon";

interface ContextMenuState {
  x: number;
  y: number;
  file: FileEntry | null;
}

function ContextMenuPortal({
  menu,
  onClose,
  onCreateFile,
  onRename,
  onDelete,
}: {
  menu: ContextMenuState;
  onClose: () => void;
  onCreateFile: () => void;
  onRename: (file: FileEntry) => void;
  onDelete: (file: FileEntry) => void;
}) {
  // Adjust position so menu doesn't go off-screen
  const [adjusted, setAdjusted] = useState({ x: menu.x, y: menu.y });

  useEffect(() => {
    const menuWidth = 160;
    const menuHeight = menu.file ? 80 : 44;
    const x = Math.min(menu.x, window.innerWidth - menuWidth - 8);
    const y = Math.min(menu.y, window.innerHeight - menuHeight - 8);
    setAdjusted({ x, y });
  }, [menu.x, menu.y, menu.file]);

  return createPortal(
    <>
      {/* Invisible backdrop — clicking it closes the menu */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        className="fixed z-[9999] bg-card border border-border shadow-lg rounded-md py-1 min-w-[160px] text-sm"
        style={{ top: adjusted.y, left: adjusted.x }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {menu.file ? (
          <>
            <button
              className="w-full text-left px-4 py-1.5 hover:bg-muted"
              onClick={() => { onRename(menu.file!); onClose(); }}
            >
              Rename
            </button>
            <button
              className="w-full text-left px-4 py-1.5 hover:bg-destructive hover:text-destructive-foreground text-red-500"
              onClick={() => { onDelete(menu.file!); onClose(); }}
            >
              Delete
            </button>
          </>
        ) : (
          <button
            className="w-full text-left px-4 py-1.5 hover:bg-muted"
            onClick={() => { onCreateFile(); onClose(); }}
          >
            New File
          </button>
        )}
      </div>
    </>,
    document.body
  );
}

function Node({
  file,
  roomId,
  userRole,
  onFileChange,
  onContextMenu,
}: {
  file: FileEntry;
  roomId: string;
  userRole: string;
  onFileChange: () => void;
  onContextMenu: (e: React.MouseEvent, file: FileEntry) => void;
}) {
  const { openTab, activeTabId } = useWorkspaceStore();

  const handleClick = () => {
    openTab({
      id: file.id,
      path: file.path,
      language: file.language,
    });
  };

  const isActive = activeTabId === file.id;

  return (
    <div
      className={`flex items-center px-4 py-1.5 cursor-pointer text-[13px] transition-colors group ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, file)}
    >
      <span className="mr-2 opacity-90 drop-shadow-sm">
        <FileIcon name={file.path} size={15} />
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

export function FileTree({
  roomId,
  files,
  userRole,
  onFileChange,
}: {
  roomId: string;
  files: FileEntry[];
  userRole: string;
  onFileChange: () => void;
}) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeTab = useWorkspaceStore((state) => state.closeTab);

  // Ensure portal target exists (SSR-safe)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const canEdit = userRole === "owner" || userRole === "editor" || !userRole;

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, file: FileEntry | null) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canEdit) return;
      setContextMenu({ x: e.clientX, y: e.clientY, file });
    },
    [canEdit]
  );

  const handleCreateFile = useCallback(async () => {
    const name = await useModalStore
      .getState()
      .showPrompt("File name:", "", "Enter the name for the new file (e.g. main.cpp)");
    if (!name?.trim()) return;

    // Detect language from extension
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    const langMap: Record<string, string> = {
      js: "javascript", ts: "typescript", tsx: "typescript", jsx: "javascript",
      py: "python", java: "java", cpp: "cpp", cc: "cpp", c: "c",
      go: "go", rs: "rust", rb: "ruby", php: "php", html: "html",
      css: "css", json: "json", md: "markdown", sh: "shell",
    };
    const language = langMap[ext] ?? "plaintext";

    try {
      await createFile(roomId, name.trim(), language);
      onFileChange();
    } catch (err: any) {
      useModalStore.getState().showAlert("Error", err.message);
    }
  }, [roomId, onFileChange]);

  const handleRename = useCallback(
    async (file: FileEntry) => {
      const newName = await useModalStore
        .getState()
        .showPrompt("New name:", file.path, "Enter the new file name.");
      if (!newName || newName === file.path) return;

      try {
        await renameFile(file.id, newName);
        useWorkspaceStore.getState().updateTabPath(file.id, newName);
        onFileChange();
      } catch (err: any) {
        useModalStore.getState().showAlert("Error", err.message);
      }
    },
    [onFileChange]
  );

  const handleDelete = useCallback(
    async (file: FileEntry) => {
      const confirmed = await useModalStore
        .getState()
        .showConfirm("Delete File", `Are you sure you want to delete "${file.path}"?`);
      if (!confirmed) return;

      try {
        await deleteFile(file.id);
        // Close the tab if it's open
        closeTab(file.id);
        onFileChange();
      } catch (err: any) {
        useModalStore.getState().showAlert("Error", err.message);
      }
    },
    [onFileChange, closeTab]
  );

  const displayFiles = files
    .filter((f) => !f.path.endsWith(".gitkeep"))
    .sort((a, b) => a.path.localeCompare(b.path));

  return (
    <div
      className="relative h-full"
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      <div className="flex items-center justify-between px-4 py-2 group">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          File Manager
        </span>
        {canEdit && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCreateFile}
              className="text-muted-foreground hover:text-foreground p-1"
              title="New File"
            >
              <Plus size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-1 pb-20">
        {displayFiles.map((file) => (
          <Node
            key={file.id}
            file={file}
            roomId={roomId}
            userRole={userRole}
            onFileChange={onFileChange}
            onContextMenu={handleContextMenu}
          />
        ))}
        {displayFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <span className="text-[13px] font-semibold text-foreground mb-1">No Files Created</span>
            <p className="text-xs text-muted-foreground mb-2">Create your first file to start collaborating.</p>
            {canEdit && (
              <button 
                onClick={handleCreateFile}
                className="text-xs px-2.5 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition font-medium"
              >
                Create File
              </button>
            )}
          </div>
        )}
      </div>

      {mounted && contextMenu && (
        <ContextMenuPortal
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onCreateFile={handleCreateFile}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
