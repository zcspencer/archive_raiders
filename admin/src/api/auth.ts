import {
  authResponseSchema,
  loginRequestSchema,
  registerRequestSchema,
  type AuthResponse
} from "@odyssey/shared";
import { requestJson } from "./client";

/**
 * Logs in a teacher account.
 */
export async function loginTeacher(
  email: string,
  password: string
): Promise<AuthResponse> {
  const payload = loginRequestSchema.parse({ email, password });
  const response = await requestJson<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return authResponseSchema.parse(response);
}

/**
 * Registers a teacher account for local development flows.
 */
export async function registerTeacher(
  displayName: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const payload = registerRequestSchema.parse({
    displayName,
    email,
    password,
    role: "teacher"
  });
  const response = await requestJson<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return authResponseSchema.parse(response);
}
