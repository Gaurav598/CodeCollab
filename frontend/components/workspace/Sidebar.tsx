"use client";

import { useEffect, useRef, useState } from "react";
import { getRoomFiles, FileEntry, createFile } from "@/services/workspaceService";
import { FileTree } from "./FileTree";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Settings } from "lucide-react";
import { stompService } from "@/services/stompClient";
import { RoomSettings } from "./RoomSettings";

export function Sidebar({
  roomCode,
  roomId,
  userRole,
  onFilesLoaded,
}: {
  roomCode: string;
  roomId: string;
  userRole: string;
  onFilesLoaded?: (files: FileEntry[]) => void;
}) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  // Track whether initial load is done so STOMP re-fetches don't fight the first load
  const initialLoadDone = useRef(false);

  useEffect(() => {
    initialLoadDone.current = false;
    fetchFiles();
  }, [roomCode]);

  // Subscribe to workspace events so all users get real-time file list updates
  useEffect(() => {
    if (!roomId) return;

    const destination = `/topic/room.${roomId}.workspace`;

    const subscription = stompService.subscribe(destination, () => {
      // Only refresh after initial load to avoid redundant calls
      if (initialLoadDone.current) {
        fetchFiles();
      }
    });

    return () => {
      stompService.unsubscribe(destination);
    };
  }, [roomId]);

  async function fetchFiles() {
    try {
      const data = await getRoomFiles(roomCode);
      setFiles(data);
      onFilesLoaded?.(data);
    } catch (err) {
      console.error("[Sidebar] fetchFiles error:", err);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }

  return (
    <>
      <div className="w-[200px] min-w-[200px] border-r border-border bg-muted/30 flex flex-col h-full">
        <div className="pl-4 pr-3 py-3 border-b border-border flex items-center justify-between bg-gradient-to-b from-muted/50 to-transparent">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shadow-sm border border-primary/20">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 18l6-6-6-6" />
                <path d="M8 6l-6 6 6 6" />
              </svg>
            </div>
            <h2 className="font-bold text-[15px] truncate tracking-wide bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              CodeCollab
            </h2>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="group flex items-center justify-center w-8 h-8 rounded-md bg-muted/50 hover:bg-primary/10 border border-transparent hover:border-primary/20 text-muted-foreground hover:text-primary transition-all duration-300 shrink-0 shadow-sm"
            title="Room Settings"
          >
            <Settings size={17} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">Loading...</div>
          ) : (
            <FileTree
              roomId={roomId}
              files={files}
              userRole={userRole}
              onFileChange={fetchFiles}
            />
          )}
        </div>
      </div>
      {showSettings && (
        <RoomSettings
          roomCode={roomCode}
          userRole={userRole}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
