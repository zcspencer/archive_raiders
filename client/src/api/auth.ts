import {
  authResponseSchema,
  loginRequestSchema,
  registerRequestSchema,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest
} from "@odyssey/shared";
import { requestJson } from "./client";

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
