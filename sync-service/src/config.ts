import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(1234),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  BACKEND_INTERNAL_URL: z.string().url().default("http://localhost:8080/api/v1/internal"),
  SERVICE_JWT_SECRET: z.string().min(1).default("replace-with-a-strong-service-secret"),
});

export const config = envSchema.parse(process.env);
