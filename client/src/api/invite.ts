import {
  acceptInviteRequestSchema,
  authResponseSchema,
  inviteInfoSchema,
  type AcceptInviteRequest,
  type AuthResponse,
  type InviteInfo
} from "@odyssey/shared";
import { requestJson } from "./client";

/**
 * Fetches public invite information by token.
 */
export async function fetchInviteInfo(token: string): Promise<InviteInfo> {
  const response = await requestJson<InviteInfo>(`/invites/${token}`);
  return inviteInfoSchema.parse(response);
}

/**
 * Accepts an invite, creating a student account and enrolling in the classroom.
 */
export async function acceptInvite(
  token: string,
  payload: AcceptInviteRequest
): Promise<AuthResponse> {
  const body = acceptInviteRequestSchema.parse(payload);
  const response = await requestJson<AuthResponse>(`/invites/${token}/accept`, {
    method: "POST",
    body: JSON.stringify(body)
  });
  return authResponseSchema.parse(response);
}
