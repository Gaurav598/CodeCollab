"use client";

import React, { InputHTMLAttributes, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check, Circle } from "lucide-react";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  showStrength?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, showStrength = false, className = "", id, value = "", onChange, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    
    // Safety check for value type
    const passValue = typeof value === "string" ? value : "";

    // Requirements logic
    const reqs = [
      { id: "len", label: "Minimum 8 characters", valid: passValue.length >= 8 },
      { id: "up",  label: "One uppercase letter", valid: /[A-Z]/.test(passValue) },
      { id: "low", label: "One lowercase letter", valid: /[a-z]/.test(passValue) },
      { id: "num", label: "One number",           valid: /[0-9]/.test(passValue) },
      { id: "spc", label: "One special character",valid: /[^A-Za-z0-9]/.test(passValue) },
    ];
    
    const validCount = reqs.filter(r => r.valid).length;
    
    // Strength logic
    let strengthLabel = "";
    let strengthColor = "";
    let strengthWidth = "0%";
    
    if (passValue.length === 0) {
      strengthLabel = "";
      strengthWidth = "0%";
    } else if (validCount <= 1) {
      strengthLabel = "Weak";
      strengthColor = "#ef4444"; // red-500
      strengthWidth = "20%";
    } else if (validCount === 2) {
      strengthLabel = "Fair";
      strengthColor = "#f97316"; // orange-500
      strengthWidth = "40%";
    } else if (validCount === 3) {
      strengthLabel = "Good";
      strengthColor = "#eab308"; // yellow-500
      strengthWidth = "60%";
    } else if (validCount === 4) {
      strengthLabel = "Strong";
      strengthColor = "#22c55e"; // green-500
      strengthWidth = "80%";
    } else if (validCount === 5) {
      strengthLabel = "Excellent";
      strengthColor = "#10b981"; // emerald-500
      strengthWidth = "100%";
    }

    // Handlers for "Press and Hold to Reveal"
    const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault(); // Prevent default text selection
      setIsPressed(true);
      setShowPassword(true);
    };

    const handlePressEnd = () => {
      setIsPressed(false);
      setShowPassword(false);
    };

    // Ensure it hides if user drags mouse outside and releases
    useEffect(() => {
      const handleGlobalMouseUp = () => handlePressEnd();
      window.addEventListener("mouseup", handleGlobalMouseUp);
      window.addEventListener("touchend", handleGlobalMouseUp);
      return () => {
        window.removeEventListener("mouseup", handleGlobalMouseUp);
        window.removeEventListener("touchend", handleGlobalMouseUp);
      };
    }, []);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label 
          htmlFor={id} 
          className="text-sm font-medium text-foreground/80 transition-colors"
          style={{ color: isFocused ? "hsl(var(--primary))" : undefined }}
        >
          {label}
        </label>
        
        <div className="relative flex items-center">
          <input
            id={id}
            ref={ref}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`
              w-full rounded-xl border bg-background/50 px-4 py-3 pr-12 text-sm 
              text-foreground placeholder:text-muted-foreground/50
              focus:placeholder-transparent placeholder:transition-colors
              outline-none transition-all duration-300
              [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[-webkit-text-fill-color:hsl(var(--foreground))] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]
              ${error && !isFocused
                ? "border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
                : "border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10"
              }
              ${className}
            `}
            {...props}
          />
          
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={handlePressStart}
            onTouchStart={handlePressStart}
            onMouseUp={handlePressEnd}
            onTouchEnd={handlePressEnd}
            onMouseLeave={handlePressEnd}
            className="absolute right-3 p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none outline-none"
            title="Press and hold to reveal"
          >
            <motion.div
              animate={{ scale: isPressed ? 0.85 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </motion.div>
          </button>
          
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

        {/* Error Message */}
        <AnimatePresence>
          {error && !showStrength && (
            <motion.div
              initial={{ opacity: 0, y: -10, x: -5 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                x: [0, -5, 5, -5, 0],
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

        {/* Live Strength & Requirements (Only shown when requested, usually on Register) */}
        <AnimatePresence>
          {showStrength && isFocused && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="mt-2 flex flex-col gap-3 rounded-xl border border-border/40 bg-background/80 p-4 shadow-2xl backdrop-blur-xl lg:absolute lg:bottom-0 lg:-left-[350px] lg:w-[320px] lg:mt-0 z-50"
            >
            {/* Strength Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Password strength</span>
                <motion.span
                  key={strengthLabel}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ color: strengthColor || "hsl(var(--muted-foreground))" }}
                >
                  {strengthLabel || "None"}
                </motion.span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: strengthWidth, backgroundColor: strengthColor || "transparent" }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
              {reqs.map((req) => (
                <div key={req.id} className="flex items-center gap-2">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: req.valid ? [1, 1.2, 1] : 1,
                      color: req.valid ? "#10b981" : "hsl(var(--muted-foreground) / 0.5)",
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {req.valid ? <Check size={14} strokeWidth={3} /> : <Circle size={14} />}
                  </motion.div>
                  <span
                    className="text-[11px] font-medium transition-opacity duration-300"
                    style={{ 
                      color: "hsl(var(--foreground))", 
                      opacity: req.valid ? 1 : 0.6 
                    }}
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
