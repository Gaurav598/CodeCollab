import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(1234),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  BACKEND_INTERNAL_URL: z.string().url().default("http://localhost:8080/api/v1/internal"),
  SERVICE_JWT_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  DOCUMENT_FLUSH_DEBOUNCE_MS: z.coerce.number().int().positive().default(1000),
  DOCUMENT_FLUSH_MAX_WAIT_MS: z.coerce.number().int().positive().default(5000),
  AUTHORIZATION_RECHECK_MS: z.coerce.number().int().positive().default(30000),
});

export const config = envSchema.parse(process.env);
