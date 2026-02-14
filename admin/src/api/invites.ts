import {
  createInviteRequestSchema,
  inviteInfoSchema,
  type InviteInfo
} from "@odyssey/shared";
import { requestJson } from "./client";

/**
 * Sends a classroom invite to a student by email.
 */
export async function sendClassroomInvite(
  accessToken: string,
  classroomId: string,
  email: string
): Promise<InviteInfo> {
  const payload = createInviteRequestSchema.parse({ email });
  const response = await requestJson<InviteInfo>(
    `/classrooms/${classroomId}/invites`,
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    accessToken
  );
  return inviteInfoSchema.parse(response);
}
