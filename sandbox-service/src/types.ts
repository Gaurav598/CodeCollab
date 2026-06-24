export type SupportedLanguage =
  | "java"
  | "cpp"
  | "python"
  | "javascript"
  | "typescript"
  | "go";

export interface ExecuteRequest {
  language: SupportedLanguage;
  sourceCode: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface ExecuteResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  timedOut: boolean;
  error?: string;
}

export interface LanguageRunner {
  language: SupportedLanguage;
  mainFile: string;
  buildCommand: string;
  runCommand: string;
}
