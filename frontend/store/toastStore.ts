import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastState {
  toasts: Toast[];
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  success: (message) => set((state) => {
    const id = Date.now().toString();
    return { toasts: [...state.toasts, { id, message, type: 'success' }] };
  }),
  error: (message) => set((state) => {
    const id = Date.now().toString();
    return { toasts: [...state.toasts, { id, message, type: 'error' }] };
  }),
  info: (message) => set((state) => {
    const id = Date.now().toString();
    return { toasts: [...state.toasts, { id, message, type: 'info' }] };
  }),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));
