import type { LanguageRunner, SupportedLanguage } from "../types.js";

const RUNNERS: Record<SupportedLanguage, LanguageRunner> = {
  java: {
    language: "java",
    mainFile: "Main.java",
    buildCommand: "javac Main.java 2>&1",
    runCommand: "java Main < /workspace/stdin.txt 2>&1",
  },
  cpp: {
    language: "cpp",
    mainFile: "main.cpp",
    buildCommand: "g++ -O0 -pipe -o /workspace/main main.cpp 2>&1 && chmod +x /workspace/main",
    runCommand: "/workspace/main < /workspace/stdin.txt 2>&1",
  },
  python: {
    language: "python",
    mainFile: "main.py",
    buildCommand: "true",
    runCommand: "python3 main.py < /workspace/stdin.txt 2>&1",
  },
  javascript: {
    language: "javascript",
    mainFile: "main.js",
    buildCommand: "true",
    runCommand: "node main.js < /workspace/stdin.txt 2>&1",
  },
  typescript: {
    language: "typescript",
    mainFile: "main.ts",
    buildCommand: "npx --yes tsc main.ts --target ES2020 --module commonjs --esModuleInterop 2>&1",
    runCommand: "node main.js < /workspace/stdin.txt 2>&1",
  },
  go: {
    language: "go",
    mainFile: "main.go",
    buildCommand: "go build -o /workspace/main main.go 2>&1 && chmod +x /workspace/main",
    runCommand: "/workspace/main < /workspace/stdin.txt 2>&1",
  },
};

export const SUPPORTED_LANGUAGES = Object.keys(RUNNERS) as SupportedLanguage[];

export function getRunner(language: string): LanguageRunner | null {
  if (!(language in RUNNERS)) {
    return null;
  }
  return RUNNERS[language as SupportedLanguage];
}

export function buildRunScript(runner: LanguageRunner): string {
  return `#!/bin/sh
set -e
cd /workspace
export HOME=/tmp
export GOPATH=/tmp/go
export GOCACHE=/tmp/go-cache
export GOTMPDIR=/workspace
mkdir -p /tmp/go /tmp/go-cache /workspace

COMPILE_OUT=$(mktemp)
RUN_OUT=$(mktemp)
COMPILE_ERR=0
RUN_ERR=0

if ! ${runner.buildCommand} > "$COMPILE_OUT" 2>&1; then
  COMPILE_ERR=1
  cat "$COMPILE_OUT"
  exit 1
fi

if ! ${runner.runCommand} > "$RUN_OUT" 2>&1; then
  RUN_ERR=1
fi

cat "$RUN_OUT"
exit $RUN_ERR
`;
}
