"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/workspace/Sidebar";
import { Tabs } from "@/components/workspace/Tabs";
import { Save, Lock } from "lucide-react";
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

const CS_QUOTES = [
  "Talk is cheap. Show me the code. — Linus Torvalds",
  "Programs must be written for people to read, and only incidentally for machines to execute. — Harold Abelson",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. — Martin Fowler",
  "First, solve the problem. Then, write the code. — John Johnson",
  "Experience is the name everyone gives to their mistakes. — Oscar Wilde",
  "Java is to JavaScript what car is to Carpet. — Chris Heilmann",
  "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code. — Dan Salomon",
  "Perfection is achieved not when there is nothing more to add, but rather when there is nothing more to take away. — Antoine de Saint-Exupery",
  "Code is like humor. When you have to explain it, it’s bad. — Cory House",
  "Fix the cause, not the symptom. — Steve Maguire",
  "Optimism is an occupational hazard of programming: feedback is the treatment. — Kent Beck",
  "When to use iterative development? You should use iterative development only on projects that you want to succeed. — Martin Fowler",
  "Simplicity is the soul of efficiency. — Austin Freeman",
  "Before software can be reusable it first has to be usable. — Ralph Johnson",
  "Make it work, make it right, make it fast. — Kent Beck",
  "The best error message is the one that never shows up. — Thomas Fuchs",
  "If at first you don’t succeed; call it version 1.0 — Unknown",
  "Programming isn't about what you know; it's about what you can figure out. — Chris Pine",
  "Testing leads to failure, and failure leads to understanding. — Burt Rutan",
  "The most disastrous thing that you can ever learn is your first programming language. — Alan Kay"
];

function PendingScreen({ roomId, userId, onApproved }: { roomId: string; userId: string; onApproved: (role: string) => void }) {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    setQuote(CS_QUOTES[Math.floor(Math.random() * CS_QUOTES.length)]);
  }, []);

  useEffect(() => {
    const dest = `/topic/room.${roomId}.approval`;
    const sub = stompService.subscribe(dest, (msg) => {
      try {
        const body = JSON.parse(msg.body);
        if (body.event === "user.approved" && body.userId === userId) {
          onApproved(body.role);
        }
      } catch (e) {}
    });
    return () => stompService.unsubscribe(dest);
  }, [roomId, userId]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background/95 backdrop-blur-sm relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-50 pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center max-w-lg mx-auto text-center p-8 bg-card/50 border border-border/50 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <div className="relative bg-background border border-border p-4 rounded-full shadow-inner">
            <Lock className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold tracking-tight mb-3 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Awaiting Approval
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          The room owner has been notified and needs to approve your request to join.
        </p>

        <div className="w-full h-[1px] bg-border/50 mb-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-transparent text-xs text-muted-foreground/50 uppercase tracking-widest">
            While you wait
          </div>
        </div>

        <div className="min-h-[80px] flex items-center justify-center">
          {quote ? (
            <p className="text-sm font-medium text-muted-foreground/80 italic animate-in fade-in zoom-in duration-500">
              "{quote.split(' — ')[0]}"
              <br />
              <span className="text-xs text-primary/70 not-italic mt-2 block">— {quote.split(' — ')[1]}</span>
            </p>
          ) : (
            <div className="flex space-x-2 justify-center items-center h-full">
              <div className="animate-bounce w-2 h-2 bg-primary/50 rounded-full" style={{ animationDelay: '0ms' }}></div>
              <div className="animate-bounce w-2 h-2 bg-primary/50 rounded-full" style={{ animationDelay: '150ms' }}></div>
              <div className="animate-bounce w-2 h-2 bg-primary/50 rounded-full" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
        </div>
      </div>
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

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      if (user && roomCode && !hasFetched.current) {
        hasFetched.current = true;
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
      <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-[200px] border-r border-border bg-muted/10 flex flex-col">
          <div className="h-[45px] border-b border-border bg-muted/20 animate-pulse" />
          <div className="flex-1 p-4 space-y-4 mt-2">
            <div className="h-3 bg-muted/20 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-muted/20 rounded w-5/6 animate-pulse" />
            <div className="h-3 bg-muted/20 rounded w-1/2 animate-pulse" />
            <div className="h-3 bg-muted/20 rounded w-2/3 animate-pulse" />
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs Skeleton */}
          <div className="h-11 border-b border-border bg-muted/5 flex items-center px-4 space-x-2">
            <div className="h-7 bg-muted/20 rounded w-32 animate-pulse" />
            <div className="h-7 bg-muted/20 rounded w-24 animate-pulse" />
          </div>
          
          <div className="flex-1 flex">
            {/* Code Editor Skeleton */}
            <div className="flex-1 p-6 space-y-4 bg-[#1e1e1e]">
              <div className="h-4 bg-muted/20 rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-muted/20 rounded w-1/2 animate-pulse ml-8" />
              <div className="h-4 bg-muted/20 rounded w-1/4 animate-pulse ml-16" />
              <div className="h-4 bg-muted/20 rounded w-2/3 animate-pulse ml-8" />
              <div className="h-4 bg-muted/20 rounded w-1/5 animate-pulse" />
            </div>
            
            {/* Right Panel Skeleton */}
            <div className="w-[300px] md:w-[350px] border-l border-border bg-muted/5 flex flex-col">
              <div className="h-11 border-b border-border bg-muted/20 animate-pulse" />
              <div className="flex-1 p-4 space-y-4">
                <div className="h-32 bg-muted/20 rounded-xl animate-pulse" />
                <div className="h-32 bg-muted/20 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background/95 backdrop-blur-sm relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] opacity-50 pointer-events-none" />
        
        <div className="z-10 flex flex-col items-center max-w-md mx-auto p-8 bg-card/50 border border-border/50 rounded-2xl shadow-2xl backdrop-blur-md">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
            <div className="relative bg-background border border-border p-4 rounded-full shadow-inner text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-foreground">
            Something went wrong
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {error || "Room not found or you don't have access."}
          </p>

          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md shadow hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // userRole from API response; fall back to editor for non-members
  const isOwner = user?.id === room.ownerId;
  const userRole = isOwner ? "owner" : (room.role ?? "editor");

  if (userRole === "pending") {
    return <PendingScreen roomId={room.id} userId={user!.id} onApproved={(newRole) => {
      setRoom({ ...room, role: newRole });
    }} />;
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
