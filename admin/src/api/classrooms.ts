import {
  classroomListSchema,
  classroomSchema,
  createClassroomRequestSchema,
  type Classroom
} from "@odyssey/shared";
import { requestJson } from "./client";

/**
 * Lists classrooms for the signed-in teacher.
 */
export async function listClassrooms(accessToken: string): Promise<Classroom[]> {
  const response = await requestJson<Classroom[]>("/classrooms", {}, accessToken);
  return classroomListSchema.parse(response);
}

/**
 * Creates a classroom for the signed-in teacher.
 */
export async function createClassroom(
  accessToken: string,
  name: string
): Promise<Classroom> {
  const payload = createClassroomRequestSchema.parse({ name });
  const response = await requestJson<Classroom>(
    "/classrooms",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    accessToken
  );
  return classroomSchema.parse(response);
}
