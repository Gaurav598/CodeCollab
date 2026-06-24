import { describe, expect, it } from "vitest";
import { useWorkspaceStore } from "@/store/workspaceStore";

const initialState = {
  openTabs: [],
  activeTabId: null,
  expandedFolders: [],
  activeProjectId: null,
};

describe("workspaceStore", () => {
  it("opens, activates, and closes tabs without duplicating them", () => {
    useWorkspaceStore.setState(initialState);
    const tab = { id: "file-1", projectId: "project-1", path: "src/app.ts", language: "typescript" };

    useWorkspaceStore.getState().openTab(tab);
    useWorkspaceStore.getState().openTab(tab);

    expect(useWorkspaceStore.getState().openTabs).toHaveLength(1);
    expect(useWorkspaceStore.getState().activeTabId).toBe("file-1");

    useWorkspaceStore.getState().closeTab("file-1");
    expect(useWorkspaceStore.getState().openTabs).toHaveLength(0);
    expect(useWorkspaceStore.getState().activeTabId).toBeNull();
  });

  it("tracks folder expansion and active project state", () => {
    useWorkspaceStore.setState(initialState);

    useWorkspaceStore.getState().toggleFolder("src/components");
    useWorkspaceStore.getState().setActiveProject("project-2");

    expect(useWorkspaceStore.getState().expandedFolders).toContain("src/components");
    expect(useWorkspaceStore.getState().activeProjectId).toBe("project-2");

    useWorkspaceStore.getState().toggleFolder("src/components");
    expect(useWorkspaceStore.getState().expandedFolders).not.toContain("src/components");
  });
});
