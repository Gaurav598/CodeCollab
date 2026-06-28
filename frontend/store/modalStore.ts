import { create } from "zustand";

type ModalType = "prompt" | "confirm" | "alert" | null;

interface ModalState {
  type: ModalType;
  title: string;
  message?: string;
  defaultValue?: string;
  isOpen: boolean;
  resolve: ((value: any) => void) | null;
  showPrompt: (title: string, defaultValue?: string, message?: string) => Promise<string | null>;
  showConfirm: (title: string, message?: string) => Promise<boolean>;
  showAlert: (title: string, message?: string) => Promise<void>;
  close: (value: any) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  type: null,
  title: "",
  isOpen: false,
  resolve: null,
  showPrompt: (title, defaultValue = "", message) => {
    return new Promise((resolve) => {
      set({
        type: "prompt",
        title,
        message,
        defaultValue,
        isOpen: true,
        resolve,
      });
    });
  },
  showConfirm: (title, message) => {
    return new Promise((resolve) => {
      set({
        type: "confirm",
        title,
        message,
        isOpen: true,
        resolve,
      });
    });
  },
  showAlert: (title, message) => {
    return new Promise((resolve) => {
      set({
        type: "alert",
        title,
        message,
        isOpen: true,
        resolve,
      });
    });
  },
  close: (value) => {
    set((state) => {
      if (state.resolve) {
        state.resolve(value);
      }
      return { isOpen: false, resolve: null };
    });
  },
}));

