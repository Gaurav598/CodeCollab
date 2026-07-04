"use client";

import { useEffect, useState } from "react";
import { RoomMember, getRoomMembers, approveMember, patchMember, removeMember } from "@/services/workspaceService";
import { Trash2, ChevronRight, Users, Copy, Code2, Link as LinkIcon } from "lucide-react";
import { useModalStore } from "@/store/modalStore";
import { useToastStore } from "@/store/toastStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { motion, AnimatePresence } from "framer-motion";
import { stompService } from "@/services/stompClient";

export function RoomSettings({ roomCode, roomId, userRole }: { roomCode: string, roomId?: string, userRole: string }) {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const setWorkspaceMembers = useWorkspaceStore(state => state.setRoomMembers);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [roomUrl, setRoomUrl] = useState("");
  const { success } = useToastStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRoomUrl(`${window.location.origin}/room/${roomCode}`);
    }
    fetchMembers();
  }, [roomCode]);

  useEffect(() => {
    setWorkspaceMembers(members);
  }, [members, setWorkspaceMembers]);

  useEffect(() => {
    if (!roomId) return;
    const dest = `/topic/room.${roomId}.workspace`;
    const callback = (msg: any) => {
      try {
        const body = JSON.parse(msg.body);
        if (body.event === "MEMBERSHIP_UPDATED" || body.event === "MEMBER_REMOVED") {
           // We can optimistically update the state or just fetch.
           if (body.event === "MEMBERSHIP_UPDATED" && body.membershipStatus !== "REMOVED") {
               setMembers(prev => {
                   const exists = prev.find(m => m.userId === body.userId);
                   if (exists) {
                       return prev.map(m => m.userId === body.userId ? { ...m, role: body.role } : m);
                   } else {
                       // New member or pending, fallback to fetch for simplicity (we don't have username in the STOMP payload right now)
                       fetchMembers();
                       return prev;
                   }
               });
           } else if (body.event === "MEMBER_REMOVED" || (body.event === "MEMBERSHIP_UPDATED" && body.membershipStatus === "REMOVED")) {
               setMembers(prev => prev.filter(m => m.userId !== body.userId));
           }
        }
      } catch (e) {
        console.error("Failed to parse STOMP message in RoomSettings", e);
      }
    };
    
    stompService.subscribe(dest, callback);
    return () => stompService.unsubscribe(dest, callback);
  }, [roomId]);



  async function fetchMembers() {
    try {
      const data = await getRoomMembers(roomCode);
      setMembers(data);
    } catch (error) {
      console.error("Failed to fetch members", error);
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    success("Invite code copied");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    success("Room link copied");
  };

  return (
    <div className="flex flex-col border-b border-border bg-background/50 shrink-0">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors group cursor-pointer focus:outline-none focus:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <motion.div
            initial={false}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground group-hover:text-foreground"
          >
            <ChevronRight size={16} />
          </motion.div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
            Room Settings
          </span>
        </div>
        <div className="flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
          <Users size={12} />
          {loading ? "-" : members.length}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden flex flex-col max-h-[50vh]"
          >
            <div className="px-4 pb-3 space-y-4 flex flex-col flex-1 min-h-0">
              
              {/* Invite Code */}
              <div className="shrink-0">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Invite Code</h3>
                <button 
                  onClick={handleCopyCode}
                  className="w-full group relative flex items-center justify-between bg-muted/30 border border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-[0_0_10px_rgba(var(--primary),0.1)] rounded-md px-3 py-2 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <Code2 size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-mono text-sm font-bold tracking-widest text-foreground">{roomCode}</span>
                  </div>
                  <Copy size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all duration-300 transform group-hover:scale-110" />
                </button>
              </div>

              {/* Room Link */}
              <div className="shrink-0">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Room Link</h3>
                <button 
                  onClick={handleCopyLink}
                  className="w-full group relative flex items-center justify-between bg-muted/30 border border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-[0_0_10px_rgba(var(--primary),0.1)] rounded-md px-3 py-2 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer overflow-hidden"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <LinkIcon size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground truncate transition-colors">
                      {roomUrl || "Loading..."}
                    </span>
                  </div>
                  <Copy size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all duration-300 transform group-hover:scale-110 shrink-0 ml-2" />
                </button>
              </div>

              {/* Team Members */}
              <div className="flex flex-col flex-1 min-h-0 border border-border rounded-md bg-background/50">
                <div className="px-3 py-2 border-b border-border bg-muted/20 shrink-0">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Team Members</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                  {loading ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">Loading...</div>
                  ) : (
                    members.map(m => (
                      <div key={m.userId} className="flex flex-col p-2 bg-muted/10 hover:bg-muted/30 rounded border border-transparent hover:border-border transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-xs text-foreground truncate max-w-[100px]">{m.username}</span>
                          
                          {/* Role Badge or Dropdown */}
                          {userRole === "owner" && m.role !== "owner" && m.role !== "pending" ? (
                            <select 
                              value={m.role}
                              onChange={(e) => handleUpdateRole(m.userId, e.target.value)}
                              className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded capitalize outline-none cursor-pointer border border-transparent hover:border-primary/30 transition-colors"
                            >
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                              m.role === 'owner' ? 'bg-purple-500/10 text-purple-400' : 
                              m.role === 'pending' ? 'bg-warning/10 text-warning' :
                              m.role === 'editor' ? 'bg-primary/10 text-primary' :
                              'bg-blue-500/10 text-blue-400'
                            }`}>
                              {m.role}
                            </span>
                          )}
                        </div>
                        
                        {/* Pending Actions */}
                        {userRole === "owner" && m.role === "pending" && (
                          <div className="flex items-center gap-1 mt-1">
                            <button 
                              onClick={() => handleApprove(m.userId, "editor")}
                              className="flex-1 text-[9px] font-bold px-1 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
                            >
                              Approve Editor
                            </button>
                            <button 
                              onClick={() => handleApprove(m.userId, "viewer")}
                              className="flex-1 text-[9px] font-bold px-1 py-1 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20 transition-colors"
                            >
                              Approve Viewer
                            </button>
                          </div>
                        )}
                        
                        {/* Remove Member */}
                        {userRole === "owner" && m.role !== "owner" && (
                          <button 
                            onClick={() => handleRemove(m.userId)}
                            className="flex items-center justify-center gap-1 mt-1.5 text-[9px] font-bold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded py-1 transition-colors"
                          >
                            <Trash2 size={10} />
                            {m.role === 'pending' ? 'Reject' : 'Remove Member'}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
