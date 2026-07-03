"use client";

import React, { InputHTMLAttributes, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label 
          htmlFor={id} 
          className="text-sm font-medium text-foreground/80 transition-colors"
          style={{ color: isFocused ? "hsl(var(--primary))" : undefined }}
        >
          {label}
        </label>
        
        <div className="relative">
          <input
            id={id}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`
              w-full rounded-xl border bg-background/50 px-4 py-3 text-sm 
              text-foreground placeholder:text-muted-foreground/50
              focus:placeholder-transparent placeholder:transition-colors
              outline-none transition-all duration-300
              [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[-webkit-text-fill-color:hsl(var(--foreground))] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]
              ${error 
                ? "border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
                : "border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10"
              }
              ${className}
            `}
            {...props}
          />
          
          {/* Subtle animated background glow on focus */}
          <AnimatePresence>
            {isFocused && !error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-primary/5 blur-md"
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, x: -5 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                x: [0, -5, 5, -5, 0], // shake animation
              }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ 
                opacity: { duration: 0.2 },
                y: { duration: 0.2 },
                x: { duration: 0.4, ease: "easeInOut" }
              }}
              className="text-[13px] font-medium text-red-500 mt-0.5 flex items-start gap-1.5 leading-snug"
            >
              <svg className="w-4 h-4 shrink-0 mt-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";
