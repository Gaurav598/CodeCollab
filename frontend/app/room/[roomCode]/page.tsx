"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/workspace/Sidebar";
import { Tabs } from "@/components/workspace/Tabs";
import dynamic from "next/dynamic";

const CollabEditor = dynamic(
  () => import("@/components/editor/CollabEditor").then((m) => m.CollabEditor),
  { ssr: false }
);
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { NotificationBell } from "@/components/communication/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getRoom, Project, Room } from "@/services/workspaceService";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user } = useAuthStore();
  const closeAllTabs = useWorkspaceStore(state => state.closeAllTabs);
  const [room, setRoom] = useState<Room | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Clear stale tabs from a previous room session to prevent 404s on Yjs doc connect
  useEffect(() => {
    closeAllTabs();
  }, [roomCode]);

  useEffect(() => {
    if (user && roomCode) {
      fetchRoom();
    }
  }, [user, roomCode]);

  async function fetchRoom() {
    try {
      const data = await getRoom(roomCode);
      setRoom(data);
    } catch (err: any) {
      setError(err.message || "Failed to load room");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading workspace...</div>;
  }

  if (error || !room) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 text-red-500 p-4 rounded mb-6">
          {error || "Room not found."}
        </div>
      </div>
    );
  }

  // userRole from API response; fall back to viewer for non-members
  const isOwner = user?.id === room.ownerId;
  const userRole = isOwner ? "owner" : (room.role ?? "viewer");

  return (
    <div className="flex w-full h-full">
      <Sidebar roomCode={room.roomCode} userRole={userRole} onProjectsLoaded={setProjects} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex h-11 items-center justify-between border-b border-border bg-background/95 px-3">
          <Tabs />
          <div className="flex items-center gap-2">
            <span className="hidden rounded border border-border px-2 py-1 text-xs text-muted-foreground md:inline">
              Cmd/Ctrl K
            </span>
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
        <CollabEditor roomId={room.id} />
      </div>
      <CommandPalette
        projects={projects}
        roomCode={room.roomCode}
        onRunCode={() => window.dispatchEvent(new Event("collabcode:run-active-file"))}
        onFocusAi={() => undefined}
      />
    </div>
  );
}
