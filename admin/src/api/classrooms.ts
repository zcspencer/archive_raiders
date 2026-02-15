import {
  classroomListSchema,
  classroomMembershipSchema,
  classroomSchema,
  createClassroomMembershipRequestSchema,
  createClassroomRequestSchema,
  type Classroom,
  type ClassroomMembership
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
 * Gets a classroom by id for the signed-in teacher.
 */
export async function getClassroom(
  accessToken: string,
  classroomId: string
): Promise<Classroom> {
  const response = await requestJson<Classroom>(`/classrooms/${classroomId}`, {}, accessToken);
  return classroomSchema.parse(response);
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

/**
 * Enrolls a student by email into a teacher-owned classroom.
 */
export async function addClassroomMembership(
  accessToken: string,
  classroomId: string,
  studentEmail: string
): Promise<ClassroomMembership> {
  const payload = createClassroomMembershipRequestSchema.parse({ studentEmail });
  const response = await requestJson<ClassroomMembership>(
    `/classrooms/${classroomId}/memberships`,
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    accessToken
  );
  return classroomMembershipSchema.parse(response);
}
