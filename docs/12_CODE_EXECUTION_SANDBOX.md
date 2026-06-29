# 12 — Code Execution Engine

## Architecture

Code execution is handled by a **remote AWS Execution Engine**. The local Docker-based sandbox service has been removed. The Spring Boot backend proxies all execution requests to the remote engine via REST API.

## Flow

```
User clicks "Run"
      │
      ▼
Spring Boot receives request (auth + RBAC checked — must be Owner or Editor, not Viewer)
      │
      ▼
ExecutionRateLimiter checks per-user rate limit via Redis
      │
      ▼
ExecutionEngineClient sends POST /execute to AWS Execution Engine
      │  Request: { language, sourceCode, stdin, timeoutMs }
      │  Auth: Bearer <EXECUTION_ENGINE_API_KEY> (if configured)
      ▼
AWS Execution Engine runs code in isolated environment
      │
      ▼
Response: { stdout, stderr, exitCode, executionTimeMs, timedOut, error }
      │
      ▼
Return result to the user
```

## Configuration

| Environment Variable | Description | Required |
|---|---|---|
| `EXECUTION_ENGINE_URL` | Base URL of the AWS execution engine | ✅ Yes |
| `EXECUTION_ENGINE_API_KEY` | API key for auth (leave blank if not required) | Optional |
| `EXECUTION_DEFAULT_TIMEOUT_MS` | Default execution timeout in ms (default: 5000) | No |
| `EXECUTION_MAX_TIMEOUT_MS` | Maximum allowed timeout in ms (default: 10000) | No |
| `EXECUTION_RATE_LIMIT_PER_MINUTE` | Max executions per user per minute (default: 30) | No |

## Backend Components

- `ExecutionEngineProperties` — typed config properties (`collabcode.execution.*`)
- `ExecutionEngineClient` — HTTP client that calls the remote engine
- `ExecutionService` — orchestrates auth, rate limiting, and engine delegation
- `ExecutionRateLimiter` — per-user rate limiting via Redis

## Per-user Rate Limiting

A dedicated rate limit on the execution endpoint prevents any single user from spamming the remote engine. Rate limit state is stored in Redis with a 1-minute sliding window.

## Language Support

The following languages are supported (validated server-side before forwarding to the engine):

- Java
- C++
- Python
- JavaScript
- TypeScript
- Go

## Acceptance Criteria (unchanged from original spec)
- An infinite loop in any supported language is force-killed within the timeout.
- Concurrent requests from different users don't interfere with each other.
- Exceeding the per-user rate limit returns a clear, immediate error.
- No local Docker container is required for code execution.
