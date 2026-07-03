"use client";

import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";

interface CreateRoomCardProps {
  onCreate: () => void;
  isCreating: boolean;
}

export function CreateRoomCard({ onCreate, isCreating }: CreateRoomCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="group relative"
    >
      {/* Glow behind card */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/20 to-emerald-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
      
      <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/40 bg-card/30 p-8 backdrop-blur-xl">
        <div className="mb-8">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 shadow-inner">
            <Plus size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            New Workspace
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Instantly create a secure, real-time collaborative environment.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreate}
          disabled={isCreating}
          className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_0_40px_-10px_hsl(var(--primary))] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70 hover:shadow-[0_0_60px_-15px_hsl(var(--primary))]"
        >
          {isCreating ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              Provisioning...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Plus size={18} />
              Create Room
            </span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
