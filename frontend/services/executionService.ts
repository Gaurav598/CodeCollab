import { apiFetch } from "./authService";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
}

export async function runCode(params: {
  fileId: string;
  code: string;
  language: string;
  stdin?: string;
}): Promise<ExecutionResult> {
  return apiFetch<ExecutionResult>("/execution/run", {
    method: "POST",
    body: JSON.stringify({
      fileId: params.fileId,
      code: params.code,
      language: params.language,
      stdin: params.stdin ?? "",
    }),
  });
}
