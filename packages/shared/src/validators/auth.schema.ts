import { z } from "zod";

export const userRoleSchema = z.enum(["student", "teacher"]);

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
  role: userRoleSchema.default("student")
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  role: userRoleSchema
});

export const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: authUserSchema
});
