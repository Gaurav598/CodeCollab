"use client";

import React from "react";
import { motion } from "framer-motion";

interface OAuthButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const OAuthButton = React.forwardRef<HTMLAnchorElement, OAuthButtonProps>(
  ({ icon, children, className = "", ...props }, ref) => {
    return (
      <motion.a
        ref={ref}
        whileHover="hover"
        whileTap="tap"
        initial="initial"
        variants={{
          initial: { y: 0, scale: 1 },
          hover: { y: -2, scale: 1.01 },
          tap: { y: 1, scale: 0.98 },
        }}
        className={`
          relative flex w-full items-center justify-center gap-3 overflow-hidden 
          rounded-xl border border-border/50 bg-card/40 px-4 py-3.5 
          text-sm font-semibold text-foreground backdrop-blur-md 
          transition-colors duration-300
          hover:border-primary/40 hover:bg-card/60
          ${className}
        `}
        {...props}
      >
        {/* Glow effect on hover */}
        <motion.div
          variants={{
            initial: { opacity: 0 },
            hover: { opacity: 1 },
            tap: { opacity: 0 },
          }}
          className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 transition-opacity duration-300"
        />
        
        {/* Animated Icon Container */}
        <motion.div
          variants={{
            initial: { scale: 1 },
            hover: { scale: 1.1, rotate: 5 },
            tap: { scale: 0.9, rotate: -5 },
          }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
        
        <span>{children}</span>
      </motion.a>
    );
  }
);

OAuthButton.displayName = "OAuthButton";
