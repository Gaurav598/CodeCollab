import { create } from "zustand";

export interface OpenFile {
  id: string;
  projectId: string;
  path: string;
  language: string;
}

interface EditorState {
  activeFileId: string | null;
  openFiles: OpenFile[];
  
  openFile: (file: OpenFile) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeFileId: null,
  openFiles: [],

  openFile: (file) => set((state) => {
    const isAlreadyOpen = state.openFiles.some(f => f.id === file.id);
    return {
      openFiles: isAlreadyOpen ? state.openFiles : [...state.openFiles, file],
      activeFileId: file.id
    };
  }),

  closeFile: (fileId) => set((state) => {
    const remaining = state.openFiles.filter(f => f.id !== fileId);
    let nextActive = state.activeFileId;
    if (state.activeFileId === fileId) {
      nextActive = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
    }
    return {
      openFiles: remaining,
      activeFileId: nextActive
    };
  }),

  setActiveFile: (fileId) => set({ activeFileId: fileId })
}));
