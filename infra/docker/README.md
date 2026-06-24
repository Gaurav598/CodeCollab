# Docker Infrastructure

The root `docker-compose.yml` starts the Phase 1 foundation stack:

- Next.js frontend
- Spring Boot backend
- Node.js sync service
- PostgreSQL 17
- Redis 8

Copy `.env.example` to `.env` for local development and replace placeholder secrets before any shared deployment.
