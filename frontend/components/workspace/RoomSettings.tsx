"use client";

import { useEffect, useState } from "react";
import { RoomMember, getRoomMembers } from "@/services/workspaceService";
import { X } from "lucide-react";

export function RoomSettings({ roomCode, onClose }: { roomCode: string, onClose: () => void }) {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);

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
      </div>
    </div>
  );
}
