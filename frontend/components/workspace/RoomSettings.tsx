"use client";

import { useEffect, useState } from "react";
import { RoomMember, getRoomMembers, deleteRoom } from "@/services/workspaceService";
import { X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModalStore } from "@/store/modalStore";

export function RoomSettings({ roomCode, userRole, onClose }: { roomCode: string, userRole: string, onClose: () => void }) {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMembers();
  }, [roomCode]);

  async function fetchMembers() {
    try {
      const data = await getRoomMembers(roomCode);
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border shadow-lg rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Room Settings</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invite Code</h3>
          <div className="bg-muted px-3 py-2 rounded flex items-center justify-between">
            <span className="font-mono text-lg font-bold tracking-widest">{roomCode}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(roomCode)}
              className="text-sm text-primary hover:underline"
            >
              Copy
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Members</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.userId} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{m.username}</div>
                    <div className="text-xs text-muted-foreground">ID: {m.userId}</div>
                  </div>
                  <div className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                    {m.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {userRole === "owner" && (
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2">Danger Zone</h3>
            <div className="bg-red-500/10 p-4 rounded-lg flex items-center justify-between">
              <div className="text-sm text-red-500 max-w-[200px]">
                Permanently delete this room and all its data.
              </div>
              <button 
                onClick={async () => {
                  const confirmed = await useModalStore.getState().showConfirm("Delete Room", "Are you sure you want to permanently delete this room? This action cannot be undone.");
                  if (confirmed) {
                    try {
                      await deleteRoom(roomCode);
                      router.push("/dashboard");
                    } catch {
                      useModalStore.getState().showAlert("Error", "Failed to delete room.");
                    }
                  }
                }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                <Trash2 size={16} />
                Delete Room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
