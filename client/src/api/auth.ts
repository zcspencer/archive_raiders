import {
  authResponseSchema,
  loginRequestSchema,
  registerRequestSchema,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest
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
 * Calls register endpoint and validates response.
 */
export async function registerUser(
  payload: RegisterRequest
): Promise<AuthResponse> {
  const body = registerRequestSchema.parse(payload);
  const response = await requestJson<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body)
  });
  return authResponseSchema.parse(response);
}

/**
 * Calls login endpoint and validates response.
 */
export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  const body = loginRequestSchema.parse(payload);
  const response = await requestJson<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body)
  });
  return authResponseSchema.parse(response);
}
