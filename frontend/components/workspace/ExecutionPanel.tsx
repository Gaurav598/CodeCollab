"use client";

import { useState } from "react";
import { runCode, ExecutionResult } from "@/services/executionService";

interface ExecutionPanelProps {
  fileId: string;
  language: string;
  getCode: () => string;
  disabled?: boolean;
}

export function ExecutionPanel({ fileId, language, getCode, disabled }: ExecutionPanelProps) {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const response = await runCode({
        fileId,
        code: getCode(),
        language,
      });
      setResult(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Execution failed";
      setError(message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#252526] flex flex-col min-h-[180px] max-h-[240px]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          onClick={handleRun}
          disabled={disabled || running}
          className="px-3 py-1 text-sm rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white"
        >
          {running ? "Running..." : "Run"}
        </button>
        {result && (
          <span className="text-xs text-neutral-500">
            exit {result.exitCode} · {result.executionTimeMs}ms
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3 font-mono text-sm">
        {error && (
          <pre className="text-red-500 whitespace-pre-wrap">{error}</pre>
        )}
        {result?.stderr && (
          <pre className="text-red-400 whitespace-pre-wrap mb-2">{result.stderr}</pre>
        )}
        {result?.stdout && (
          <pre className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{result.stdout}</pre>
        )}
        {!error && !result && !running && (
          <p className="text-neutral-500 text-xs">Output will appear here after you run code.</p>
        )}
      </div>
    </div>
  );
}
