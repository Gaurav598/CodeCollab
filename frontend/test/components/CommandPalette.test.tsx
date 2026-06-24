import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { Project } from "@/services/workspaceService";

const project: Project = {
  id: "project-1",
  roomId: "room-1",
  name: "Core",
  createdAt: "2026-06-24T00:00:00Z",
  files: [
    { id: "file-1", projectId: "project-1", path: "src/app.ts", language: "typescript", createdAt: "2026-06-24T00:00:00Z" },
    { id: "file-2", projectId: "project-1", path: "src/.gitkeep", language: "plaintext", createdAt: "2026-06-24T00:00:00Z" },
  ],
};

describe("CommandPalette", () => {
  it("opens with Ctrl+K, filters files, and opens selected file", async () => {
    useWorkspaceStore.setState({ openTabs: [], activeTabId: null, expandedFolders: [], activeProjectId: null });
    render(<CommandPalette projects={[project]} roomCode="ROOM42" onRunCode={vi.fn()} onFocusAi={vi.fn()} />);

    await userEvent.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("dialog", { name: /command palette/i })).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/search files/i), "app");
    await userEvent.click(screen.getByRole("button", { name: /src\/app\.ts/i }));

    expect(useWorkspaceStore.getState().activeProjectId).toBe("project-1");
    expect(useWorkspaceStore.getState().activeTabId).toBe("file-1");
    expect(screen.queryByRole("dialog", { name: /command palette/i })).not.toBeInTheDocument();
  });

  it("runs command actions from the palette", async () => {
    const onRunCode = vi.fn();
    render(<CommandPalette projects={[project]} roomCode="ROOM42" onRunCode={onRunCode} onFocusAi={vi.fn()} />);

    await userEvent.keyboard("{Meta>}k{/Meta}");
    await userEvent.click(screen.getByRole("button", { name: /run active file/i }));

    expect(onRunCode).toHaveBeenCalledTimes(1);
  });
});
