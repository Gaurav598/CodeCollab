import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TabData {
  id: string;        // File entry id
  path: string;      // File path
  language: string;  // File language
}

interface WorkspaceState {
  openTabs: TabData[];
  activeTabId: string | null;
  expandedFolders: string[]; // paths of folders that are expanded in the file tree
  activeRoomCode: string | null;

  // Actions
  openTab: (tab: TabData) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  toggleFolder: (folderPath: string) => void;
  setActiveRoomCode: (roomCode: string) => void;
  updateTabPath: (tabId: string, path: string) => void;
  updateTabLanguage: (tabId: string, language: string) => void;
  closeAllTabs: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      openTabs: [],
      activeTabId: null,
      expandedFolders: [],
      activeRoomCode: null,

      openTab: (tab) => {
        const { openTabs } = get();
        const existing = openTabs.find(t => t.id === tab.id);
        if (!existing) {
          set({ openTabs: [...openTabs, tab], activeTabId: tab.id });
        } else {
          set({ activeTabId: tab.id });
        }
      },

      closeTab: (tabId) => {
        const { openTabs, activeTabId } = get();
        const newTabs = openTabs.filter(t => t.id !== tabId);
        let newActiveId = activeTabId;
        if (activeTabId === tabId) {
          newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
        }
        set({ openTabs: newTabs, activeTabId: newActiveId });
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      toggleFolder: (folderPath) => {
        const { expandedFolders } = get();
        if (expandedFolders.includes(folderPath)) {
          set({ expandedFolders: expandedFolders.filter(p => p !== folderPath) });
        } else {
          set({ expandedFolders: [...expandedFolders, folderPath] });
        }
      },

      setActiveRoomCode: (roomCode) => set({ activeRoomCode: roomCode }),

      updateTabPath: (tabId, path) => {
        const { openTabs } = get();
        set({
          openTabs: openTabs.map(t => t.id === tabId ? { ...t, path } : t)
        });
      },

      updateTabLanguage: (tabId, language) => {
        const { openTabs } = get();
        set({
          openTabs: openTabs.map(t => t.id === tabId ? { ...t, language } : t)
        });
      },

      closeAllTabs: () => set({ openTabs: [], activeTabId: null }),
    }),
    {
      name: 'workspace-storage',
    }
  )
);
