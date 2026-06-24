"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRooms, createRoom, joinRoom, Room } from "@/services/workspaceService";
import { useAuthStore } from "@/store/authStore";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  async function fetchRooms() {
    try {
      setLoading(true);
      const data = await getUserRooms();
      setRooms(data);
    } catch (err: any) {
      setError(err.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom(visibility: "public" | "private") {
    try {
      const room = await createRoom(visibility);
      router.push(`/room/${room.roomCode}`);
    } catch (err: any) {
      setError(err.message || "Failed to create room");
    }
  }

  async function handleJoinRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      await joinRoom(joinCode.trim());
      router.push(`/room/${joinCode.trim()}`);
    } catch (err: any) {
      setError(err.message || "Failed to join room");
    }
  }

  if (!user) {
    return <div className="p-8">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Rooms</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading rooms...</p>
          ) : rooms.length === 0 ? (
            <p className="text-muted-foreground">You haven't joined any rooms yet.</p>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div 
                  key={room.id}
                  className="p-4 border rounded hover:border-primary cursor-pointer flex justify-between items-center transition-colors"
                  onClick={() => router.push(`/room/${room.roomCode}`)}
                >
                  <div>
                    <div className="font-medium text-lg font-mono">{room.roomCode}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {room.visibility} • Role: {room.role}
                    </div>
                  </div>
                  <div className="text-sm text-primary">Enter &rarr;</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="p-6 border rounded bg-card">
            <h2 className="text-xl font-semibold mb-4">Create a New Room</h2>
            <div className="flex gap-4">
              <button
                onClick={() => handleCreateRoom("public")}
                className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium hover:bg-primary/90 flex-1"
              >
                Create Public Room
              </button>
              <button
                onClick={() => handleCreateRoom("private")}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded font-medium hover:bg-secondary/80 flex-1"
              >
                Create Private Room
              </button>
            </div>
          </div>

          <div className="p-6 border rounded bg-card">
            <h2 className="text-xl font-semibold mb-4">Join an Existing Room</h2>
            <form onSubmit={handleJoinRoom} className="flex gap-4">
              <input
                type="text"
                placeholder="Room Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 bg-background border rounded px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
