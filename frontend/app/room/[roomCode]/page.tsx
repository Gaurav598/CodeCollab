"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/workspace/Sidebar";
import { Tabs } from "@/components/workspace/Tabs";
import { CollabEditor } from "@/components/editor/CollabEditor";
import { getRoom, Room } from "@/services/workspaceService";
import { useAuthStore } from "@/store/authStore";

export default function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user } = useAuthStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // userRole is implicitly editor if owner, otherwise we'd fetch actual role.
  // For UI permissions in Phase 4, we assume user is owner/editor if they can see the room.
  const isOwner = user?.id === room.ownerId;
  const userRole = isOwner ? "owner" : "editor";

  return (
    <div className="flex w-full h-full">
      <Sidebar roomCode={room.roomCode} userRole={userRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <Tabs />
        <CollabEditor roomId={room.id} />
      </div>
    </div>
  );
}
