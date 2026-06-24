import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  SERVICE_JWT_SECRET: z.string().min(1).default("replace-with-a-strong-service-secret"),
  RUNNER_IMAGE: z.string().min(1).default("collabcode/sandbox-runner:latest"),
  DEFAULT_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  MAX_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  MEMORY_LIMIT_BYTES: z.coerce.number().int().positive().default(268435456),
  CPU_LIMIT: z.coerce.number().positive().default(1),
  PIDS_LIMIT: z.coerce.number().int().positive().default(64),
  MAX_SOURCE_BYTES: z.coerce.number().int().positive().default(65536),
  MAX_OUTPUT_BYTES: z.coerce.number().int().positive().default(65536),
});

export const config = envSchema.parse(process.env);
