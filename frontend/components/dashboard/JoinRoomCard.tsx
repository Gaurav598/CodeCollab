"use client";

import { motion } from "framer-motion";
import { Link as LinkIcon, ArrowRight } from "lucide-react";
import { useState } from "react";

interface JoinRoomCardProps {
  joinCode: string;
  setJoinCode: (code: string) => void;
  onJoin: (e: React.FormEvent) => void;
  isJoining?: boolean;
}

export function JoinRoomCard({ joinCode, setJoinCode, onJoin, isJoining }: JoinRoomCardProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="group relative"
    >
      <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/40 bg-card/20 p-8 backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/30 text-foreground">
            <LinkIcon size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Join Existing
            </h2>
            <p className="text-xs text-muted-foreground">
              Have an invite code? Enter it below.
            </p>
          </div>
        </div>

        <form onSubmit={onJoin} className="relative mt-2">
          <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${isFocused ? 'border-primary/50 shadow-[0_0_20px_-5px_hsl(var(--primary))]' : 'border-border/40'}`}>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="e.g. BMSfB2rU"
              className="w-full bg-background/50 px-4 py-3.5 pr-12 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50 focus:placeholder-transparent placeholder:transition-colors"
            />
            <button
              type="submit"
              disabled={!joinCode.trim() || isJoining}
              className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/30 disabled:text-primary-foreground/30"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
