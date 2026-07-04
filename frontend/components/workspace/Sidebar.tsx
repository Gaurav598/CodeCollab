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

    const callback = (msg: any) => {
      try {
        const body = JSON.parse(msg.body);
        if (body.event === "file.changed") {
          // Only refresh after initial load to avoid redundant calls
          if (initialLoadDone.current) {
            fetchFiles();
          }
        }
      } catch (e) {
        console.error("[Sidebar] Failed to parse STOMP message", e);
      }
    };

    stompService.subscribe(destination, callback);

    return () => {
      stompService.unsubscribe(destination, callback);
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
      <div className="w-[200px] min-w-[200px] border-r border-border bg-background flex flex-col h-full">
        <div className="py-4 px-4 border-b border-border flex items-center justify-start bg-background w-full">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shadow-sm border border-primary/20">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 18l6-6-6-6" />
                <path d="M8 6l-6 6 6 6" />
                <path d="M14 4l-4 16" />
              </svg>
            </div>
            <h2 className="font-bold text-[17px] truncate tracking-wide bg-[linear-gradient(to_right,var(--tw-gradient-stops))] from-primary via-blue-400 to-purple-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
              CodeCollab
            </h2>
          </div>
        </div>

        <RoomSettings roomCode={roomCode} roomId={roomId} userRole={userRole} />

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
    </>
  );
}
