"use client";

import { useToastStore } from '@/store/toastStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: any, onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="pointer-events-auto flex items-center gap-3 bg-background/60 backdrop-blur-md border border-border/50 shadow-lg rounded-xl px-4 py-3 min-w-[280px]"
    >
      {toast.type === 'success' && <CheckCircle2 className="text-green-500" size={18} />}
      {toast.type === 'error' && <XCircle className="text-red-500" size={18} />}
      {toast.type === 'info' && <Info className="text-blue-500" size={18} />}
      
      <span className="text-[13px] font-medium text-foreground flex-1">
        {toast.message}
      </span>
    </motion.div>
  );
}
