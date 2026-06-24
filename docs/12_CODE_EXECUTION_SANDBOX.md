# 12 — Code Execution Sandbox

Second most important spec file after the CRDT engine (`06_CRDT_ENGINE.md`).

## Current state (old project)
Code execution is proxied to a third-party compiler API (Judge0-style), with no resource isolation on the host, no execution timeout enforcement visible in the old code, and no rate limiting — any user could hammer the endpoint or run resource-heavy code with no cap.

## Target state: Docker-based sandbox

### Flow
```
User clicks "Run"
      │
      ▼
Spring Boot receives request (auth + RBAC checked — must be Owner or Editor, not Viewer)
      │
      ▼
Create ephemeral Docker container (via Docker Engine SDK)
      │
      ▼
Inject user's code + stdin into the container
      │
      ▼
Execute, with a hard timeout
      │
      ▼
Capture stdout / stderr / exit code
      │
      ▼
Destroy the container (always — success, failure, or timeout)
      │
      ▼
Return result to the user
```

### Resource limits (mandatory)
- **CPU:** capped per container (e.g. via Docker's `--cpus` equivalent in the SDK)
- **Memory:** capped per container (e.g. ~50MB, tunable)
- **Timeout:** hard wall-clock limit (e.g. 3–10 seconds); the container is force-killed if exceeded, preventing an infinite loop from hanging indefinitely or degrading the host
- **Network:** no outbound network access from inside the execution container (prevents executed code from exfiltrating data or hitting external services)

### Per-user rate limiting
A dedicated rate limit on the execution endpoint, independent of other endpoints, so one user can't drain shared compute capacity or crash the host by spamming "Run."

### Language support
At minimum, match the old project's supported languages; document the final list explicitly once implemented (e.g. Python, JavaScript/Node, Java, C++) so the frontend's language selector and the sandbox's available container images stay in sync.
Java
C++
Python
JavaScript
TypeScript
Go

The supported language matrix for v1 is: Java, C++, Python, JavaScript, TypeScript, and Go. The frontend language selector, execution request validation, and sandbox runtime images must stay in sync with this list.

## Explicit non-goals
- No full container-orchestration platform (no Kubernetes job scheduling needed for execution specifically) — a single Docker host driven via the SDK is sufficient at this project's scale.
- No persistent storage of execution results beyond returning them in the response (don't need an "execution history" feature unless requested later).

## Acceptance criteria
- An infinite loop in any supported language is force-killed within the timeout and does not slow down or crash the host.
- Code attempting filesystem access outside its container, or any outbound network call, fails (proves isolation).
- Concurrent "Run" requests from different users in different rooms don't interfere with each other.
- Exceeding the per-user rate limit returns a clear, immediate error — not a silent failure, not a crash.
