"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [stdin, setStdin] = useState("");

  const handleRun = useCallback(async () => {
    if (disabled || running) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const response = await runCode({
        fileId,
        code: getCode(),
        language,
        stdin,
      });
      setResult(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Execution failed";
      setError(message);
    } finally {
      setRunning(false);
    }
  }, [disabled, fileId, getCode, language, running, stdin]);

  useEffect(() => {
    function runFromPalette() {
      void handleRun();
    }
    window.addEventListener("collabcode:run-active-file", runFromPalette);
    return () => window.removeEventListener("collabcode:run-active-file", runFromPalette);
  }, [handleRun]);

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#252526] flex flex-col min-h-[200px] h-64">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="text-sm font-semibold text-neutral-500">Execution Panel</div>
        <div className="flex items-center gap-3">
          {result && (
            <span className="text-xs font-medium text-neutral-500 bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded">
              Exit {result.exitCode} · {result.executionTimeMs}ms
            </span>
          )}
          <button
            type="button"
            onClick={handleRun}
            disabled={disabled || running}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm transition-colors flex items-center gap-2"
          >
            {running ? (
              <>
                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Running
              </>
            ) : "Run Code"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-2 p-2 bg-neutral-50 dark:bg-[#252526]">
        {/* Input Section */}
        <div className="flex-1 flex flex-col rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1e1e1e] overflow-hidden">
          <div className="px-3 py-1.5 text-xs font-semibold text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#2a2a2b]">
            Program Input
          </div>
          <textarea
            className="flex-1 w-full p-3 font-mono text-sm bg-transparent resize-none focus:outline-none dark:text-neutral-300"
            placeholder="Provide program input here..."
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
          />
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col min-w-0 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#151515] overflow-hidden">
          <div className="px-3 py-1.5 text-xs font-semibold text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-200 dark:bg-[#1e1e1e]">
            Program Output
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
              <p className="text-neutral-500 text-xs">Output will appear here after execution.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
