"use client";

import { useEffect, useState } from "react";
import { RoomMember, getRoomMembers, deleteRoom, approveMember, patchMember, removeMember } from "@/services/workspaceService";
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

  async function handleApprove(targetUserId: string, role: "editor" | "viewer") {
    try {
      await approveMember(roomCode, targetUserId, role);
      await fetchMembers();
    } catch (err: any) {
      useModalStore.getState().showAlert("Error", err.message || "Failed to approve member");
    }
  }

  async function handleUpdateRole(targetUserId: string, role: string) {
    try {
      await patchMember(roomCode, targetUserId, role);
      await fetchMembers();
    } catch (err: any) {
      useModalStore.getState().showAlert("Error", err.message || "Failed to update role");
    }
  }

  async function handleRemove(targetUserId: string) {
    const confirmed = await useModalStore.getState().showConfirm("Remove Member", "Are you sure you want to remove this member?");
    if (confirmed) {
      try {
        await removeMember(roomCode, targetUserId);
        await fetchMembers();
      } catch (err: any) {
        useModalStore.getState().showAlert("Error", err.message || "Failed to remove member");
      }
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
                  <div className="flex items-center gap-2">
                    {userRole === "owner" && m.role === "pending" ? (
                      <>
                        <button 
                          onClick={() => handleApprove(m.userId, "editor")}
                          className="text-xs font-semibold px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition"
                        >
                          Approve Editor
                        </button>
                        <button 
                          onClick={() => handleApprove(m.userId, "viewer")}
                          className="text-xs font-semibold px-2 py-1 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20 transition"
                        >
                          Approve Viewer
                        </button>
                        <button 
                          onClick={() => handleRemove(m.userId)}
                          className="text-xs font-semibold px-2 py-1 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition"
                        >
                          Reject
                        </button>
                      </>
                    ) : userRole === "owner" && m.role !== "owner" ? (
                      <div className="flex items-center gap-2">
                        <select 
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m.userId, e.target.value)}
                          className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded capitalize outline-none"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button 
                          onClick={() => handleRemove(m.userId)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                        {m.role}
                      </div>
                    )}
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
