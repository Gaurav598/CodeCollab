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
    <div className="border-t border-border bg-muted/30 flex flex-col min-h-[200px] h-64">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Execution Panel</div>
        <div className="flex items-center gap-3">
          {result && (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
              Exit {result.exitCode} · {result.executionTimeMs}ms
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setResult(null); setError(null); setStdin(""); }}
              className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-sm"
            >
              Clear
            </button>
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
      </div>

      <div className="flex flex-1 min-h-0 gap-2 p-2 bg-muted/10">
        {/* Input Section */}
        <div className="flex-1 flex flex-col rounded-md border border-border bg-background overflow-hidden">
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border bg-muted/50">
            Program Input
          </div>
          <textarea
            className="flex-1 w-full p-3 font-mono text-sm bg-transparent resize-none focus:outline-none text-foreground placeholder-muted-foreground/50"
            placeholder="Provide program input here..."
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
          />
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col min-w-0 rounded-md border border-border bg-background overflow-hidden">
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border bg-muted/50">
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
              <pre className="text-foreground whitespace-pre-wrap">{result.stdout}</pre>
            )}
            {!error && !result && !running && (
              <p className="text-muted-foreground text-xs">Output will appear here after execution.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
