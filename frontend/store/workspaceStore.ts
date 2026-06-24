import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TabData {
  id: string;        // File entry id
  projectId: string; // Project id
  path: string;      // File path
  language: string;  // File language
}

interface WorkspaceState {
  openTabs: TabData[];
  activeTabId: string | null;
  expandedFolders: string[]; // paths of folders that are expanded in the file tree
  activeProjectId: string | null;

  // Actions
  openTab: (tab: TabData) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  toggleFolder: (folderPath: string) => void;
  setActiveProject: (projectId: string) => void;
  closeAllTabs: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      openTabs: [],
      activeTabId: null,
      expandedFolders: [],
      activeProjectId: null,

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

      setActiveProject: (projectId) => set({ activeProjectId: projectId }),

      closeAllTabs: () => set({ openTabs: [], activeTabId: null }),
    }),
    {
      name: 'workspace-storage',
    }
  )
);
