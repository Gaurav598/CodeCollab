# DevOps Prompt

Use this when setting up containerization, CI/CD, and deployment, separately from feature development.

---

**Prompt to paste:**

You are setting up the DevOps infrastructure for "CollabCode," a system composed of: a Next.js frontend, a Spring Boot backend, a Node.js CRDT sync microservice, PostgreSQL, and Redis. Read `02_SYSTEM_ARCHITECTURE.md` and `19_DEVOPS_DEPLOYMENT.md` before proceeding.

Key requirements:
- Write a Dockerfile for each service (Next.js, Spring Boot, Node.js sync service) — multi-stage builds where appropriate to keep images small.
- Write a `docker-compose.yml` that brings up all five components (the three app services + PostgreSQL + Redis) with correct networking, environment variable injection, and startup dependency ordering (e.g. backend waits for PostgreSQL to be ready).
- All secrets (database credentials, JWT signing key, OAuth client secrets, AI provider API keys) are injected via environment variables / a `.env` file that is gitignored — never hardcoded, never committed.
- Set up a GitHub Actions workflow that: runs backend tests (JUnit), runs frontend/E2E tests (Playwright) if present, and builds Docker images on push to main. Keep it simple — lint/test/build, not a full deployment pipeline unless asked.
- Structure services to be Kubernetes-ready: externalized config (no hardcoded environment-specific values), stateless app services (session/socket state lives in Redis/PostgreSQL, not in-process memory), and a health-check endpoint on each service (e.g. `/health`) suitable for liveness/readiness probes later.
- Do not reintroduce the old project's "self-ping to prevent cold start" hack unless the actual chosen hosting platform specifically requires it — if it does, document why in `19_DEVOPS_DEPLOYMENT.md`.

Confirm with me before choosing a specific cloud provider or before adding any infrastructure-as-code tool (Terraform, etc.) not already mentioned in the docs.
