import express from "express";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { config } from "./config.js";
import { checkDockerHealth, executeCode } from "./executor.js";
import { SUPPORTED_LANGUAGES } from "./runners/index.js";

const app = express();
app.use(express.json({ limit: "128kb" }));

function requireServiceAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing service token" } });
    return;
  }
  const token = header.slice(7);
  const expected = Buffer.from(config.SERVICE_JWT_SECRET);
  const provided = Buffer.from(token);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid service token" } });
    return;
  }
  next();
}

const executeSchema = z.object({
  language: z.enum(["java", "cpp", "python", "javascript", "typescript", "go"]),
  sourceCode: z.string().min(1).max(config.MAX_SOURCE_BYTES),
  stdin: z.string().max(8192).optional().default(""),
  timeoutMs: z.number().int().positive().max(config.MAX_TIMEOUT_MS).optional(),
});

app.get("/health", async (_req, res) => {
  const dockerOk = await checkDockerHealth();
  res.status(dockerOk ? 200 : 503).json({
    status: dockerOk ? "ok" : "degraded",
    docker: dockerOk,
    languages: SUPPORTED_LANGUAGES,
  });
});

app.post("/execute", requireServiceAuth, async (req, res) => {
  const parsed = executeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.errors.map((e) => e.message).join("; "),
      },
    });
    return;
  }

  const result = await executeCode(parsed.data);
  res.status(200).json(result);
});

const server = app.listen(config.PORT, () => {
  console.log(`sandbox-service listening on port ${config.PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
