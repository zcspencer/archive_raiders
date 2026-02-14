import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  ADMIN_ORIGIN: z.string().default("http://localhost:5174"),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://odyssey:dev_password@localhost:5432/odyssey_dev"),
  JWT_SECRET: z.string().min(8).default("odyssey-local-dev-secret"),
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  CONTENT_DIR: z.string().default("content")
});

export interface AppConfig extends z.infer<typeof envSchema> {
  ALLOWED_ORIGINS: string[];
}

/**
 * Validates and returns runtime config from environment variables.
 */
export function loadConfig(): AppConfig {
  const parsed = envSchema.parse(process.env);
  return {
    ...parsed,
    ALLOWED_ORIGINS: [parsed.CLIENT_ORIGIN, parsed.ADMIN_ORIGIN]
  };
}
