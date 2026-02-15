import {
  classroomInviteSummaryListSchema,
  createInviteRequestSchema,
  inviteInfoSchema,
  type ClassroomInviteSummary,
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

/**
 * Lists invites previously sent for a classroom.
 */
export async function listClassroomInvites(
  accessToken: string,
  classroomId: string
): Promise<ClassroomInviteSummary[]> {
  const response = await requestJson<ClassroomInviteSummary[]>(
    `/classrooms/${classroomId}/invites`,
    {},
    accessToken
  );
  return classroomInviteSummaryListSchema.parse(response);
}
