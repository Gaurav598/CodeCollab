import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(1235),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  BACKEND_INTERNAL_URL: z.string().url().default("http://localhost:8080/api/v1/internal"),
  SERVICE_JWT_SECRET: z.string().min(1).default("4a7c8d9e2f1a3b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6"),
});

export const config = envSchema.parse(process.env);
