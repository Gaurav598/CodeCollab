import { apiFetch } from "./authService";

export type AiFeature =
  | "chat"
  | "refactor"
  | "detect-bugs"
  | "explain"
  | "review"
  | "generate-tests"
  | "generate-docs";

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiRequest {
  fileId?: string;
  projectId?: string;
  language?: string;
  path?: string;
  code?: string;
  selection?: string;
  instruction?: string;
  contextFileIds?: string[];
  conversation?: AiMessage[];
}

export interface AiResponse {
  feature: string;
  provider: string;
  fallback: boolean;
  content: string;
  previewCode: string;
  findings: Array<{ severity: string; message: string }>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  securityConcerns: string[];
  performanceConcerns: string[];
  contextFiles: Array<{ fileId: string; path: string; language: string; content: string }>;
  latencyMs: number;
}

export interface AutocompleteResponse {
  suggestions: string[];
  provider: string;
  fallback: boolean;
  latencyMs: number;
}

const featurePath: Record<AiFeature, string> = {
  chat: "/ai/chat",
  refactor: "/ai/refactor",
  "detect-bugs": "/ai/detect-bugs",
  explain: "/ai/explain",
  review: "/ai/review",
  "generate-tests": "/ai/generate-tests",
  "generate-docs": "/ai/generate-docs",
};

export function requestAutocomplete(payload: AiRequest, signal?: AbortSignal): Promise<AutocompleteResponse> {
  return apiFetch<AutocompleteResponse>("/ai/autocomplete", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

export function runAiFeature(feature: AiFeature, payload: AiRequest): Promise<AiResponse> {
  return apiFetch<AiResponse>(featurePath[feature], {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
