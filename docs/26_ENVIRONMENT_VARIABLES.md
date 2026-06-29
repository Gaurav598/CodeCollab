# 26 — Environment Variables

## Required Variables

| Variable | Description | Required | Default |
|---|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ Yes | — |
| `REDIS_URL` | Redis connection URL | ✅ Yes | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | ✅ Yes | — |
| `JWT_EXPIRATION` | JWT expiration in seconds | No | `900` |
| `SERVICE_JWT_SECRET` | Internal service-to-service JWT secret | ✅ Yes | — |
| `REFRESH_COOKIE_SECURE` | Set `true` in production (HTTPS) | No | `false` |
| `EXECUTION_ENGINE_URL` | Base URL of the AWS Execution Engine | ✅ Yes (for execution) | — |
| `EXECUTION_ENGINE_API_KEY` | API key for execution engine auth | No | `` |

## OAuth Variables (optional — leave blank to disable)

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |

## AI Gateway Variables (optional)

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Gemini API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `CLAUDE_API_KEY` | Anthropic Claude API key |
| `DEEPSEEK_API_KEY` | DeepSeek API key |

If all keys are blank, the `LocalFallbackProviderAdapter` handles AI requests gracefully.

## AWS S3 Variables (optional)

| Variable | Description |
|---|---|
| `AWS_ACCESS_KEY` | AWS access key for S3 storage |
| `AWS_SECRET_KEY` | AWS secret key for S3 storage |
| `AWS_BUCKET` | S3 bucket name |

## Frontend Public Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend REST API base URL | `http://localhost:8080/api/v1` |
| `NEXT_PUBLIC_SYNC_WS_URL` | Yjs sync WebSocket URL | `ws://localhost:1234` |
| `NEXT_PUBLIC_STOMP_WS_URL` | STOMP WebSocket URL | `ws://localhost:8080/ws` |

## Execution Engine Tuning Variables (optional)

| Variable | Description | Default |
|---|---|---|
| `EXECUTION_DEFAULT_TIMEOUT_MS` | Default execution timeout | `5000` |
| `EXECUTION_MAX_TIMEOUT_MS` | Maximum execution timeout | `10000` |
| `EXECUTION_RATE_LIMIT_PER_MINUTE` | Max executions per user per minute | `30` |