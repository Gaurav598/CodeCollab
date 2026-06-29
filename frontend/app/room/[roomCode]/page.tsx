"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/workspace/Sidebar";
import { Tabs } from "@/components/workspace/Tabs";
import { Save } from "lucide-react";
import dynamic from "next/dynamic";

const CollabEditor = dynamic(
  () => import("@/components/editor/CollabEditor").then((m) => m.CollabEditor),
  { ssr: false }
);
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { NotificationBell } from "@/components/communication/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getRoom, joinRoom, FileEntry, Room } from "@/services/workspaceService";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useChatStore } from "@/store/chatStore";
import { stompService } from "@/services/stompClient";

function PendingScreen({ roomId, userId }: { roomId: string; userId: string }) {
  useEffect(() => {
    const dest = `/topic/room.${roomId}.approval`;
    const sub = stompService.subscribe(dest, (msg) => {
      try {
        const body = JSON.parse(msg.body);
        if (body.event === "user.approved" && body.userId === userId) {
          window.location.reload();
        }
      } catch (e) {}
    });
    return () => stompService.unsubscribe(dest);
  }, [roomId, userId]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground flex-col gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p>Waiting for room owner approval...</p>
    </div>
  );
}

export default function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const closeAllTabs = useWorkspaceStore(state => state.closeAllTabs);
  const [room, setRoom] = useState<Room | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Clear stale tabs only if switching to a completely different room
  useEffect(() => {
    const state = useWorkspaceStore.getState();
    if (state.activeRoomCode && state.activeRoomCode !== roomCode) {
      closeAllTabs();
    }
    state.setActiveRoomCode(roomCode);
  }, [roomCode, closeAllTabs]);

  // STOMP Presence and Chat subscription bound to Room lifecycle
  useEffect(() => {
    if (room?.id) {
      const { subscribeToRoom, unsubscribeFromRoom } = useChatStore.getState();
      subscribeToRoom(room.id);
      return () => {
        unsubscribeFromRoom(room.id);
      };
    }
  }, [room?.id]);

  useEffect(() => {
    if (!isLoading) {
      if (user && roomCode) {
        fetchRoom();
      } else if (!user) {
        router.push("/login");
      }
    }
  }, [user, isLoading, roomCode, router]);

  async function fetchRoom() {
    try {
      let joinedRoomId: string | null = null;
      try {
        const joinRes = await joinRoom(roomCode) as any;
        if (joinRes?.roomId) joinedRoomId = joinRes.roomId;
      } catch (joinErr: any) {
        console.warn("Auto-join failed or already a member:", joinErr);
      }
      try {
        const data = await getRoom(roomCode);
        setRoom(data);
      } catch (err: any) {
        if (err.message === "Waiting for room owner approval" && joinedRoomId) {
          setRoom({ id: joinedRoomId, roomCode, ownerId: "", name: "Pending Room", createdAt: "", role: "pending" });
        } else {
          setError(err.message || "Failed to load room");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground">
        Loading workspace...
      </div>
    );
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

  // userRole from API response; fall back to editor for non-members
  const isOwner = user?.id === room.ownerId;
  const userRole = isOwner ? "owner" : (room.role ?? "editor");

  if (userRole === "pending") {
    return <PendingScreen roomId={room.id} userId={user!.id} />;
  }

  return (
    <div className="flex w-full h-full">
      <Sidebar roomCode={room.roomCode} roomId={room.id} userRole={userRole} onFilesLoaded={setFiles} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex h-11 items-center justify-between border-b border-border bg-background/95 px-3">
          <Tabs />
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new Event("collabcode:download-active-file"))}
              className="hidden md:flex items-center gap-1.5 rounded border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Download File Locally"
            >
              <Save size={14} />
              Download
            </button>
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
        <CollabEditor roomId={room.id} userRole={userRole} />
      </div>
      <CommandPalette
        files={files}
        roomCode={room.roomCode}
        onRunCode={() => window.dispatchEvent(new Event("collabcode:run-active-file"))}
        onFocusAi={() => undefined}
      />
    </div>
  );
}
