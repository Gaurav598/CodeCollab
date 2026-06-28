"use client";

import React, { useEffect, useRef, useState } from "react";
import { useModalStore } from "@/store/modalStore";

export function GlobalModals() {
  const { type, title, message, defaultValue, isOpen, close } = useModalStore();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button or input when modal opens
  useEffect(() => {
    if (isOpen && type === "prompt") {
      setInputValue(defaultValue || "");
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (isOpen && type === "confirm") {
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [isOpen, type, defaultValue]);

  // ESC key closes the dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "prompt") {
      close(inputValue);
    } else {
      close(true);
    }
  };

  const handleCancel = () => {
    if (type === "prompt") {
      close(null);
    } else if (type === "alert") {
      close(undefined); // alert resolves with void
    } else {
      close(false);
    }
  };

  const handleOk = () => {
    close(type === "prompt" ? inputValue : type === "alert" ? undefined : true);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget && type !== 'alert') handleCancel(); }}
      role="presentation"
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={message ? "modal-desc" : undefined}
      >
        <div className="p-6">
          <h2 id="modal-title" className="text-xl font-semibold text-zinc-100 mb-2">{title}</h2>
          {message && (
            <p id="modal-desc" className="text-sm text-zinc-400 mb-4">{message}</p>
          )}

          {type === "prompt" && (
            <form id="modal-form" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="off"
              />
            </form>
          )}
        </div>
        
        <div className="px-6 py-4 bg-zinc-950/50 flex justify-end gap-3 border-t border-zinc-800">
          {type !== "alert" && (
            <button
              ref={cancelRef}
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            form="modal-form"
            onClick={type === "confirm" || type === "alert" ? handleOk : undefined}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            autoFocus={type === "alert"}
          >
            {type === "confirm" ? "Confirm" : type === "alert" ? "OK" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
