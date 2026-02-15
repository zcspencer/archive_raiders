import {
  authResponseSchema,
  loginRequestSchema,
  registerRequestSchema,
  type AuthResponse
} from "@odyssey/shared";
import { requestJson } from "./client";

/** Server response shape for GET /auth/registration-status. */
interface RegistrationStatus {
  publicRegistrationEnabled: boolean;
}

/**
 * Fetches whether public (self-serve) registration is enabled.
 */
export async function fetchRegistrationStatus(): Promise<RegistrationStatus> {
  return requestJson<RegistrationStatus>("/auth/registration-status");
}

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
