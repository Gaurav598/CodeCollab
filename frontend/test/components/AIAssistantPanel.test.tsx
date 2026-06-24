import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { runAiFeature } from "@/services/aiService";
import type { AiResponse } from "@/services/aiService";

vi.mock("@/services/aiService", () => ({
  runAiFeature: vi.fn(),
}));

const activeFile = {
  id: "file-1",
  projectId: "project-1",
  path: "src/app.ts",
  language: "typescript",
};

const baseResponse: AiResponse = {
  feature: "BUG_DETECTION",
  provider: "local",
  fallback: true,
  content: "Local analysis",
  previewCode: "",
  findings: [],
  strengths: [],
  weaknesses: [],
  suggestions: [],
  securityConcerns: [],
  performanceConcerns: [],
  contextFiles: [],
  latencyMs: 5,
};

describe("AIAssistantPanel", () => {
  it("disables actions without an active file", () => {
    render(<AIAssistantPanel activeFile={undefined} openFiles={[]} getCode={() => ""} getSelection={() => ""} applyPreview={vi.fn()} />);

    expect(screen.getByText(/open a file/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refactor/i })).toBeDisabled();
  });

  it("runs bug detection and renders severity findings", async () => {
    vi.mocked(runAiFeature).mockResolvedValue({
      ...baseResponse,
      findings: [{ severity: "HIGH", message: "Potential injection risk" }],
    });

    render(
      <AIAssistantPanel
        activeFile={activeFile}
        openFiles={[activeFile]}
        getCode={() => "eval(input)"}
        getSelection={() => ""}
        applyPreview={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /detect bugs/i }));

    await waitFor(() => expect(runAiFeature).toHaveBeenCalledWith("detect-bugs", expect.objectContaining({
      fileId: "file-1",
      language: "typescript",
      code: "eval(input)",
    })));
    expect(await screen.findByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("Potential injection risk")).toBeInTheDocument();
  });

  it("shows refactor preview and applies it", async () => {
    const applyPreview = vi.fn();
    vi.mocked(runAiFeature).mockResolvedValue({
      ...baseResponse,
      feature: "REFACTOR",
      content: "Preview",
      previewCode: "const result = 1;",
    });

    render(
      <AIAssistantPanel
        activeFile={activeFile}
        openFiles={[activeFile]}
        getCode={() => "const x = 1;"}
        getSelection={() => "const x = 1;"}
        applyPreview={applyPreview}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /refactor/i }));
    await userEvent.click(await screen.findByRole("button", { name: /apply/i }));

    expect(applyPreview).toHaveBeenCalledWith("const result = 1;");
  });

  it("sends AI chat with conversation history", async () => {
    vi.mocked(runAiFeature).mockResolvedValue({
      ...baseResponse,
      feature: "CHAT",
      content: "This file initializes the app.",
    });

    render(
      <AIAssistantPanel
        activeFile={activeFile}
        openFiles={[activeFile]}
        getCode={() => "export default function App() {}"}
        getSelection={() => ""}
        applyPreview={vi.fn()}
      />
    );

    await userEvent.type(screen.getByRole("textbox", { name: /ai chat message/i }), "Explain this");
    await userEvent.click(screen.getByRole("button", { name: /send ai chat message/i }));

    expect(await screen.findByText("Explain this")).toBeInTheDocument();
    expect(await screen.findAllByText("This file initializes the app.")).toHaveLength(2);
    expect(runAiFeature).toHaveBeenCalledWith("chat", expect.objectContaining({
      instruction: "Explain this",
      conversation: [{ role: "user", content: "Explain this" }],
    }));
  });
});
