"use client";

import { motion } from "framer-motion";
import { Room } from "@/services/workspaceService";
import { ArrowRight, Code2 } from "lucide-react";

interface RoomCardProps {
  room: Room;
  onEnter: (roomCode: string) => void;
  index: number;
}

export function RoomCard({ room, onEnter, index }: RoomCardProps) {
  // Use a slight staggered animation based on index
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="group relative"
    >
      {/* Animated glow behind the card */}
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-primary/30 to-blue-500/30 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
      
      <div
        onClick={() => onEnter(room.roomCode)}
        className="relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border/40 bg-card/30 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/50 hover:shadow-2xl hover:shadow-primary/10"
      >
        {/* Top Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Code2 size={20} />
            </div>
            <div>
              <h3 className="font-mono text-lg font-semibold tracking-tight text-foreground">
                {room.name || room.roomCode}
              </h3>
              <p className="text-sm font-medium text-muted-foreground capitalize">
                Role: {room.role || "Member"}
              </p>
            </div>
          </div>

          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Live
            </span>
          </div>
        </div>

        {/* Decorative background element for the card */}
        <div className="absolute -bottom-8 -right-8 opacity-[0.03] transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.06]">
          <Code2 size={120} />
        </div>

        {/* Bottom Section */}
        <div className="mt-12 flex items-center justify-between border-t border-border/30 pt-4">
          <div className="text-xs text-muted-foreground">
            Created {new Date(room.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold text-primary transition-colors group-hover:text-primary/80">
            Enter Workspace 
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
