"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  Bug,
  Check,
  ClipboardList,
  FileText,
  MessageSquare,
  PencilRuler,
  ScrollText,
  ShieldAlert,
  Sparkles,
  TestTube2,
} from "lucide-react";
import { AiFeature, AiMessage, AiResponse, runAiFeature } from "@/services/aiService";
import { TabData } from "@/store/workspaceStore";

interface AIAssistantPanelProps {
  activeFile: TabData | undefined;
  openFiles: TabData[];
  getCode: () => string;
  getSelection: () => string;
  applyPreview: (code: string) => void;
}

const actions: Array<{ feature: AiFeature; label: string; icon: React.ReactNode; instruction: string }> = [
  { feature: "refactor", label: "Refactor", icon: <PencilRuler size={15} />, instruction: "Improve readability and preserve behavior." },
  { feature: "detect-bugs", label: "Detect Bugs", icon: <Bug size={15} />, instruction: "Find syntax, logic, security, and null-safety issues." },
  { feature: "explain", label: "Explain", icon: <ScrollText size={15} />, instruction: "Explain the selected code, function, class, or file." },
  { feature: "review", label: "Review", icon: <ClipboardList size={15} />, instruction: "Review strengths, weaknesses, suggestions, security, and performance." },
  { feature: "generate-tests", label: "Tests", icon: <TestTube2 size={15} />, instruction: "Generate language-aware unit tests." },
  { feature: "generate-docs", label: "Docs", icon: <FileText size={15} />, instruction: "Generate README, API docs, comments, or architecture summaries." },
];

export function AIAssistantPanel({ activeFile, openFiles, getCode, getSelection, applyPreview }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeResult, setActiveResult] = useState<AiResponse | null>(null);
  const [loadingFeature, setLoadingFeature] = useState<AiFeature | "chat" | null>(null);
  const [error, setError] = useState("");

  const contextFileIds = useMemo(
    () => openFiles.filter((tab) => tab.id !== activeFile?.id).map((tab) => tab.id).slice(0, 6),
    [openFiles, activeFile?.id]
  );

  async function run(feature: AiFeature, instruction: string) {
    if (!activeFile) return;
    setLoadingFeature(feature);
    setError("");
    try {
      const result = await runAiFeature(feature, {
        fileId: activeFile.id,
        projectId: activeFile.projectId,
        language: activeFile.language,
        path: activeFile.path,
        code: getCode(),
        selection: getSelection(),
        instruction,
        contextFileIds,
      });
      setActiveResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setLoadingFeature(null);
    }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!activeFile || !input.trim()) return;
    const nextMessages: AiMessage[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setLoadingFeature("chat");
    setError("");
    try {
      const response = await runAiFeature("chat", {
        fileId: activeFile.id,
        projectId: activeFile.projectId,
        language: activeFile.language,
        path: activeFile.path,
        code: getCode(),
        selection: getSelection(),
        instruction: input.trim(),
        conversation: nextMessages,
        contextFileIds,
      });
      setActiveResult(response);
      setMessages([...nextMessages, { role: "assistant", content: response.content }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI chat failed");
    } finally {
      setLoadingFeature(null);
    }
  }

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-border bg-background" aria-label="AI assistant panel">
      <div className="flex h-12 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <Bot size={17} className="text-primary" />
          <h2 className="text-sm font-semibold">AI Platform</h2>
        </div>
        <span className="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          Backend gateway
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-border p-3">
        {actions.map((action) => (
          <button
            key={action.feature}
            type="button"
            onClick={() => run(action.feature, action.instruction)}
            disabled={!activeFile || loadingFeature !== null}
            title={action.instruction}
            className="flex h-9 items-center justify-center gap-2 rounded border border-border bg-muted/25 px-2 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {!activeFile && (
          <div className="rounded border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Open a file to enable AI actions.
          </div>
        )}

        {error && (
          <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded border p-3 text-sm ${
                message.role === "user"
                  ? "border-primary/30 bg-primary/10"
                  : "border-border bg-muted/20 text-muted-foreground"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>

        {loadingFeature && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles size={15} className="animate-pulse text-primary" />
            Running {loadingFeature}...
          </div>
        )}

        {activeResult && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded bg-muted px-2 py-1">{activeResult.feature}</span>
              <span className="rounded bg-muted px-2 py-1">{activeResult.provider}</span>
              <span className="rounded bg-muted px-2 py-1">{activeResult.latencyMs}ms</span>
              {activeResult.fallback && <span className="rounded bg-amber-500/15 px-2 py-1 text-amber-300">fallback</span>}
            </div>

            {activeResult.findings.length > 0 && (
              <div className="space-y-2">
                {activeResult.findings.map((finding, index) => (
                  <div key={`${finding.severity}-${index}`} className="flex gap-2 rounded border border-border bg-muted/20 p-2 text-sm">
                    <ShieldAlert size={15} className="mt-0.5 text-amber-300" />
                    <div>
                      <div className="text-xs font-semibold uppercase text-muted-foreground">{finding.severity}</div>
                      <div>{finding.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeResult.previewCode && (
              <div className="rounded border border-border bg-muted/20">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <span className="text-xs font-semibold text-muted-foreground">Preview</span>
                  <button
                    type="button"
                    onClick={() => applyPreview(activeResult.previewCode)}
                    className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <Check size={13} />
                    Apply
                  </button>
                </div>
                <pre className="max-h-56 overflow-auto p-3 text-xs leading-5 text-foreground">{activeResult.previewCode}</pre>
              </div>
            )}

            {!activeResult.previewCode && (
              <pre className="whitespace-pre-wrap rounded border border-border bg-muted/20 p-3 text-sm leading-6 text-foreground">
                {activeResult.content}
              </pre>
            )}
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={!activeFile || loadingFeature !== null}
            placeholder="Ask about this workspace..."
            aria-label="AI chat message"
            className="min-w-0 flex-1 rounded border border-border bg-muted/30 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || !activeFile || loadingFeature !== null}
            aria-label="Send AI chat message"
            className="inline-flex h-9 w-9 items-center justify-center rounded bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <MessageSquare size={16} />
          </button>
        </div>
      </form>
    </aside>
  );
}
