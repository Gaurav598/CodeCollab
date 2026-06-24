import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExecutionPanel } from "@/components/workspace/ExecutionPanel";
import { runCode } from "@/services/executionService";

vi.mock("@/services/executionService", () => ({
  runCode: vi.fn(),
}));

describe("ExecutionPanel", () => {
  it("runs code and renders stdout plus execution metadata", async () => {
    vi.mocked(runCode).mockResolvedValue({
      stdout: "hello\n",
      stderr: "",
      exitCode: 0,
      executionTimeMs: 12,
    });

    render(<ExecutionPanel fileId="file-1" language="javascript" getCode={() => "console.log('hello')"} />);

    await userEvent.click(screen.getByRole("button", { name: /run/i }));

    await waitFor(() => expect(runCode).toHaveBeenCalledWith({
      fileId: "file-1",
      code: "console.log('hello')",
      language: "javascript",
    }));
    expect(await screen.findByText("hello")).toBeInTheDocument();
    expect(screen.getByText(/exit 0/)).toBeInTheDocument();
  });

  it("responds to command palette run event and shows failures", async () => {
    vi.mocked(runCode).mockRejectedValue(new Error("Sandbox unavailable"));

    render(<ExecutionPanel fileId="file-1" language="python" getCode={() => "print('x')"} />);
    act(() => {
      window.dispatchEvent(new Event("collabcode:run-active-file"));
    });

    expect(await screen.findByText("Sandbox unavailable")).toBeInTheDocument();
  });
});
