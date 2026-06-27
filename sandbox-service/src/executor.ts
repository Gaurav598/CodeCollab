import Docker from "dockerode";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { buildRunScript, getRunner } from "./runners/index.js";
import type { ExecuteRequest, ExecuteResponse } from "./types.js";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

function truncateOutput(text: string): string {
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes <= config.MAX_OUTPUT_BYTES) {
    return text;
  }
  const buf = Buffer.from(text, "utf8").subarray(0, config.MAX_OUTPUT_BYTES);
  return buf.toString("utf8") + "\n...[output truncated]";
}

function appendBoundedOutput(current: string, chunk: string): string {
  if (Buffer.byteLength(current, "utf8") > config.MAX_OUTPUT_BYTES) {
    return current;
  }
  return truncateOutput(current + chunk);
}

function splitCompileAndRun(output: string, exitCode: number): { stdout: string; stderr: string } {
  if (exitCode === 1 && output.toLowerCase().includes("error")) {
    return { stdout: "", stderr: output };
  }
  return { stdout: output, stderr: "" };
}

async function execInContainer(
  container: Docker.Container,
  cmd: string[],
  input?: string
): Promise<{ output: string; exitCode: number }> {
  const execInstance = await container.exec({
    User: "sandbox",
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true,
    AttachStdin: input !== undefined,
  });

  return new Promise((resolve, reject) => {
    execInstance.start({ hijack: true, stdin: input !== undefined }, (err, stream) => {
      if (err || !stream) {
        reject(err ?? new Error("Failed to start exec"));
        return;
      }

      let output = "";
      stream.on("data", (chunk: Buffer) => {
        output = appendBoundedOutput(output, demuxDockerLogs(chunk));
      });

      stream.on("end", async () => {
        try {
          const inspect = await execInstance.inspect();
          resolve({ output, exitCode: inspect.ExitCode ?? 1 });
        } catch (inspectErr) {
          reject(inspectErr);
        }
      });

      stream.on("error", reject);

      if (input !== undefined) {
        stream.write(input);
      }
      stream.end();
    });
  });
}

function demuxDockerLogs(raw: Buffer): string {
  let text = "";
  let offset = 0;
  while (offset < raw.length) {
    if (offset + 8 > raw.length) {
      text += raw.subarray(offset).toString("utf8");
      break;
    }
    const size = raw.readUInt32BE(offset + 4);
    offset += 8;
    text += raw.subarray(offset, offset + size).toString("utf8");
    offset += size;
  }
  return text;
}

async function writeFile(container: Docker.Container, path: string, content: string): Promise<void> {
  const result = await execInContainer(container, ["tee", path], content);
  if (result.exitCode !== 0) {
    throw new Error(`Failed to write ${path}`);
  }
}

async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<{ result?: T; timedOut: boolean }> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<{ timedOut: boolean }>((resolve) => {
    timer = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
  });

  try {
    const result = await Promise.race([
      promise.then((value) => ({ result: value, timedOut: false as const })),
      timeoutPromise,
    ]);
    return result;
  } finally {
    clearTimeout(timer!);
  }
}

export async function executeCode(request: ExecuteRequest): Promise<ExecuteResponse> {
  const started = Date.now();
  const runner = getRunner(request.language);
  if (!runner) {
    return {
      stdout: "",
      stderr: "Unsupported language",
      exitCode: 1,
      executionTimeMs: 0,
      timedOut: false,
      error: "UNSUPPORTED_LANGUAGE",
    };
  }

  const sourceBytes = Buffer.byteLength(request.sourceCode, "utf8");
  if (sourceBytes > config.MAX_SOURCE_BYTES) {
    return {
      stdout: "",
      stderr: "Source code exceeds maximum allowed size",
      exitCode: 1,
      executionTimeMs: 0,
      timedOut: false,
      error: "SOURCE_TOO_LARGE",
    };
  }

  const timeoutMs = Math.min(
    request.timeoutMs ?? config.DEFAULT_TIMEOUT_MS,
    config.MAX_TIMEOUT_MS
  );

  const jobId = randomUUID();
  let container: Docker.Container | null = null;

  try {
    container = await docker.createContainer({
      name: `collabcode-exec-${jobId}`,
      Image: config.RUNNER_IMAGE,
      User: "sandbox",
      WorkingDir: "/workspace",
      Cmd: ["sleep", "3600"],
      HostConfig: {
        AutoRemove: false,
        NetworkMode: "none",
        Memory: config.MEMORY_LIMIT_BYTES,
        MemorySwap: config.MEMORY_LIMIT_BYTES,
        NanoCpus: Math.floor(config.CPU_LIMIT * 1e9),
        PidsLimit: config.PIDS_LIMIT,
        ReadonlyRootfs: true,
        CapDrop: ["ALL"],
        SecurityOpt: ["no-new-privileges:true"],
        Tmpfs: {
          "/tmp": "size=64m,mode=1777,exec",
          "/workspace": "size=64m,mode=1777,exec",
        },
      },
    });

    await container.start();

    await writeFile(container, `/workspace/${runner.mainFile}`, request.sourceCode);
    await writeFile(container, "/workspace/stdin.txt", request.stdin ?? "");
    await writeFile(container, "/workspace/run.sh", buildRunScript(runner));
    await execInContainer(container, ["chmod", "+x", "/workspace/run.sh"]);

    const runPromise = execInContainer(container, ["sh", "/workspace/run.sh"]);
    const { result, timedOut } = await runWithTimeout(runPromise, timeoutMs);

    if (timedOut) {
      runPromise.catch(() => undefined);
      try {
        await container.kill({ signal: "SIGKILL" });
      } catch {
        // already stopped
      }
      return {
        stdout: "",
        stderr: `Execution timed out after ${timeoutMs}ms`,
        exitCode: 124,
        executionTimeMs: Date.now() - started,
        timedOut: true,
        error: "EXECUTION_TIMEOUT",
      };
    }

    const combinedOutput = truncateOutput(result?.output ?? "");
    const exitCode = result?.exitCode ?? 1;
    const { stdout, stderr } = splitCompileAndRun(combinedOutput, exitCode);

    return {
      stdout,
      stderr,
      exitCode,
      executionTimeMs: Date.now() - started,
      timedOut: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Execution failed";
    return {
      stdout: "",
      stderr: "Execution failed",
      exitCode: 1,
      executionTimeMs: Date.now() - started,
      timedOut: false,
      error: message.includes("connect") ? "DOCKER_UNAVAILABLE" : "EXECUTION_ERROR",
    };
  } finally {
    if (container) {
      try {
        await container.remove({ force: true, v: true });
      } catch {
        // best-effort cleanup
      }
    }
  }
}

export async function checkDockerHealth(): Promise<boolean> {
  try {
    await docker.ping();
    return true;
  } catch {
    return false;
  }
}
