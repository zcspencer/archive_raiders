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
  CONTENT_DIR: z.string().default("content"),
  AWS_REGION: z.string().default("us-west-2"),
  SES_FROM_EMAIL: z.string().email().optional(),
  INVITE_BASE_URL: z.string().url().optional(),
  ALLOW_PUBLIC_REGISTRATION: z
    .enum(["true", "false", "1", "0"])
    .default("false")
    .transform((v) => v === "true" || v === "1")
});

export interface AppConfig extends z.infer<typeof envSchema> {
  ALLOWED_ORIGINS: string[];
  INVITE_URL_BASE: string;
}

/**
 * Validates and returns runtime config from environment variables.
 */
export function loadConfig(): AppConfig {
  const parsed = envSchema.parse(process.env);
  return {
    ...parsed,
    ALLOWED_ORIGINS: [parsed.CLIENT_ORIGIN, parsed.ADMIN_ORIGIN],
    INVITE_URL_BASE: parsed.INVITE_BASE_URL ?? parsed.CLIENT_ORIGIN
  };
}
