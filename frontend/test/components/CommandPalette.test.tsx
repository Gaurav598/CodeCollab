import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { FileEntry } from "@/services/workspaceService";

const file: FileEntry = { 
  id: "file-1", 
  roomId: "room-1", 
  path: "src/app.ts", 
  language: "typescript", 
  createdAt: "2026-06-24T00:00:00Z" 
};

describe("CommandPalette", () => {
  it("opens palette and filters files", async () => {
    useWorkspaceStore.setState({ openTabs: [], activeTabId: null, expandedFolders: [], activeRoomCode: null });
    render(<CommandPalette files={[file]} roomCode="ROOM42" onRunCode={vi.fn()} onFocusAi={vi.fn()} />);

    await userEvent.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("dialog", { name: /command palette/i })).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/search files/i), "app");
    await userEvent.click(screen.getByRole("button", { name: /src\/app\.ts/i }));

    expect(useWorkspaceStore.getState().activeTabId).toBe("file-1");
    expect(screen.queryByRole("dialog", { name: /command palette/i })).not.toBeInTheDocument();
  });

  it("runs command actions from the palette", async () => {
    const onRunCode = vi.fn();
    render(<CommandPalette files={[file]} roomCode="ROOM42" onRunCode={onRunCode} onFocusAi={vi.fn()} />);

    await userEvent.keyboard("{Meta>}k{/Meta}");
    await userEvent.click(screen.getByRole("button", { name: /run active file/i }));

    expect(onRunCode).toHaveBeenCalledTimes(1);
  });
});
