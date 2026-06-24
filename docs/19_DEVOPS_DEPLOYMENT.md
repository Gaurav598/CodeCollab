# 19 — DevOps & Deployment

## Requirements
- **Docker** — every service (Spring Boot backend, Node.js sync microservice, Next.js frontend) containerized individually.
- **Docker Compose** — for local development and single-host deployment, orchestrating Spring Boot, the sync microservice, Next.js, PostgreSQL, and Redis together.
- **GitHub Actions** — CI/CD pipeline: run tests (see `20_TESTING_STRATEGY.md`) on every PR, build images on merge to main, optionally auto-deploy.
- **Kubernetes-ready** — services should be structured (stateless where possible, externalized config, health-check endpoints) so that moving from Docker Compose to Kubernetes manifests later doesn't require re-architecting the services themselves.
- **AWS** (or equivalent cloud provider) as the target deployment environment for anything beyond local/demo use.

## Notes carried over from the old project's deployment setup
- The old project used a self-ping hack to prevent a free-tier host from cold-starting. This workaround should not be needed in the new setup if deployed on infrastructure without aggressive cold-start behavior — but if a similar free-tier constraint applies, document the actual chosen workaround here rather than silently reintroducing an undocumented hack.
- No Dockerfile or CI/CD existed previously — both are required from the start in this rebuild, not deferred.
