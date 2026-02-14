import { classroomListSchema, type Classroom } from "@odyssey/shared";
import { requestJson } from "./client";

/**
 * Loads classrooms visible to the authenticated user.
 */
export async function listClassrooms(accessToken: string): Promise<Classroom[]> {
  const response = await requestJson<Classroom[]>("/classrooms", {
    method: "GET",
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });
  return classroomListSchema.parse(response);
}
