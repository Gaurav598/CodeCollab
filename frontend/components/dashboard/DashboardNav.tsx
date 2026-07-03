"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";

interface DashboardNavProps {
  username: string;
  onLogout: () => void;
}

export function DashboardNav({ username, onLogout }: DashboardNavProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/50 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-emerald-400">
              CollabCode
            </span>
          </Link>

          {/* Center Greeting (hidden on very small screens) */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden sm:block text-sm font-medium text-muted-foreground"
          >
            Welcome back, <span className="text-foreground">{username}</span>
          </motion.div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={onLogout}
              className="group flex items-center gap-2 rounded-full border border-border/40 bg-card/30 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-card/80 hover:text-foreground hover:shadow-lg hover:shadow-primary/5"
            >
              <LogOut size={16} className="transition-transform group-hover:-translate-x-1" />
              Logout
            </button>
          </div>
          
        </div>
      </div>
    </nav>
  );
}
