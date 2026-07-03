"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRooms, createRoom, joinRoom, Room } from "@/services/workspaceService";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Sparkles, Loader2, AlertCircle } from "lucide-react";

import { DashboardBackground } from "@/components/dashboard/DashboardBackground";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { RoomCard } from "@/components/dashboard/RoomCard";
import { CreateRoomCard } from "@/components/dashboard/CreateRoomCard";
import { JoinRoomCard } from "@/components/dashboard/JoinRoomCard";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const { signOut } = useAuth();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  async function fetchRooms() {
    try {
      setLoadingRooms(true);
      const data = await getUserRooms();
      setRooms(data);
    } catch (err: any) {
      setError(err.message || "Failed to load rooms");
    } finally {
      setLoadingRooms(false);
    }
  }

  async function handleCreateRoom() {
    try {
      setCreating(true);
      setError("");
      const room = await createRoom();
      router.push(`/room/${room.roomCode}`);
    } catch (err: any) {
      setError(err.message || "Failed to create workspace. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      setJoining(true);
      setError("");
      await joinRoom(joinCode.trim());
      router.push(`/room/${joinCode.trim()}`);
    } catch (err: any) {
      setError("We couldn't find a room with this code. Please check and try again.");
    } finally {
      setJoining(false);
    }
  }

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen w-full bg-background flex flex-col items-center justify-center p-8 text-center overflow-hidden">
        <DashboardBackground />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-md w-full p-10 rounded-3xl border border-border/40 bg-card/30 backdrop-blur-2xl shadow-2xl"
        >
          <div className="mb-8 flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 shadow-inner flex items-center justify-center">
              <Code2 size={32} className="text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4 tracking-tight text-foreground">Workspace Access</h2>
          <p className="text-muted-foreground mb-10 text-sm">
            Sign in to access your secure, real-time collaborative environments and start building together.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/login')}
            className="w-full relative overflow-hidden rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_0_40px_-10px_hsl(var(--primary))] transition-all duration-300 hover:shadow-[0_0_60px_-15px_hsl(var(--primary))]"
          >
            Authenticate to continue
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <DashboardBackground />
      <DashboardNav username={user.username} onLogout={handleLogout} />

      <main className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-12">
        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="mb-8 overflow-hidden"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-500 backdrop-blur-md">
                <AlertCircle size={18} />
                <p className="font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Your Rooms */}
          <div className="w-full lg:flex-[2]">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Your Rooms
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select a workspace to resume collaboration
                </p>
              </div>
            </div>

            {loadingRooms ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 rounded-2xl border border-border/20 bg-card/10 animate-pulse backdrop-blur-sm" />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/40 bg-card/10 py-20 text-center backdrop-blur-sm"
              >
                <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                  <Sparkles size={24} />
                </div>
                <h3 className="mb-2 text-xl font-semibold">No active rooms</h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Create a new workspace or join an existing one using an invite code from your team.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rooms.map((room, idx) => (
                  <RoomCard key={room.id} room={room} onEnter={(code) => router.push(`/room/${code}`)} index={idx} />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Actions (Sticky Sidebar) */}
          <div className="w-full lg:flex-[1] lg:sticky lg:top-28 space-y-8">
            <CreateRoomCard onCreate={handleCreateRoom} isCreating={creating} />
            <JoinRoomCard 
              joinCode={joinCode} 
              setJoinCode={setJoinCode} 
              onJoin={handleJoinRoom}
              isJoining={joining}
            />
          </div>

        </div>
      </main>
    </div>
  );
}
