#!/usr/bin/env node
/**
 * Smoke tests for all supported language runners.
 * Requires Docker and collabcode/sandbox-runner:latest.
 */
import { checkDockerHealth, executeCode } from "./executor.js";

const samples = [
  {
    language: "java" as const,
    sourceCode: `public class Main {
  public static void main(String[] args) {
    System.out.println("java ok");
  }
}
`,
    expect: "java ok",
  },
  {
    language: "cpp" as const,
    sourceCode: `#include <iostream>
int main() {
  std::cout << "cpp ok" << std::endl;
  return 0;
}
`,
    expect: "cpp ok",
  },
  {
    language: "python" as const,
    sourceCode: "print('python ok')\n",
    expect: "python ok",
  },
  {
    language: "javascript" as const,
    sourceCode: "console.log('javascript ok');\n",
    expect: "javascript ok",
  },
  {
    language: "typescript" as const,
    sourceCode: "console.log('typescript ok');\n",
    expect: "typescript ok",
  },
  {
    language: "go" as const,
    sourceCode: `package main
import "fmt"
func main() {
  fmt.Println("go ok")
}
`,
    expect: "go ok",
  },
];

async function main() {
  if (!(await checkDockerHealth())) {
    console.warn("SKIP: Docker daemon unavailable; language runner tests require Docker.");
    return;
  }

  let passed = 0;
  let failed = 0;

  for (const sample of samples) {
    const result = await executeCode({
      language: sample.language,
      sourceCode: sample.sourceCode,
      stdin: "",
      timeoutMs: 15000,
    });
    if (result.exitCode === 0 && result.stdout.includes(sample.expect)) {
      console.log(`PASS: ${sample.language}`);
      passed++;
    } else {
      console.error(`FAIL: ${sample.language}`, result);
      failed++;
    }
  }

  console.log(`\nLanguage tests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
