#!/usr/bin/env node
/**
 * Security verification suite for the sandbox executor.
 * Requires Docker daemon and collabcode/sandbox-runner:latest image.
 */
import { executeCode } from "./executor.js";

interface TestCase {
  name: string;
  language: "python" | "javascript";
  sourceCode: string;
  expect: (result: Awaited<ReturnType<typeof executeCode>>) => boolean;
}

const tests: TestCase[] = [
  {
    name: "infinite loop timeout",
    language: "python",
    sourceCode: "while True:\n    pass\n",
    expect: (r) => r.timedOut === true && r.exitCode === 124,
  },
  {
    name: "fork bomb attempt",
    language: "python",
    sourceCode: `import os
while True:
    try:
        os.fork()
    except OSError:
        break
`,
    expect: (r) => r.executionTimeMs < 9000 && !r.timedOut,
  },
  {
    name: "memory abuse",
    language: "python",
    sourceCode: "a = 'x' * (10**9)\n",
    expect: (r) => r.exitCode !== 0 || r.timedOut,
  },
  {
    name: "large output spam",
    language: "python",
    sourceCode: "print('A' * 200000)\n",
    expect: (r) => r.stdout.includes("truncated") || Buffer.byteLength(r.stdout) <= 65536 + 64,
  },
  {
    name: "network access attempt",
    language: "python",
    sourceCode: `import urllib.request
try:
    urllib.request.urlopen('http://example.com', timeout=2)
    print('network_ok')
except Exception as e:
    print('network_blocked')
`,
    expect: (r) => r.stdout.includes("network_blocked") || r.stderr.length > 0,
  },
  {
    name: "hello world baseline",
    language: "javascript",
    sourceCode: "console.log('hello');\n",
    expect: (r) => r.exitCode === 0 && r.stdout.includes("hello"),
  },
];

async function main() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await executeCode({
        language: test.language,
        sourceCode: test.sourceCode,
        stdin: "",
        timeoutMs: 5000,
      });
      if (test.expect(result)) {
        console.log(`PASS: ${test.name}`);
        passed++;
      } else {
        console.error(`FAIL: ${test.name}`, result);
        failed++;
      }
    } catch (err) {
      console.error(`FAIL: ${test.name} (threw)`, err);
      failed++;
    }
  }

  console.log(`\nSecurity tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main();
