import {
  classroomStudentEconomySchema,
  classroomStudentSummaryListSchema,
  type ClassroomStudentEconomy,
  type ClassroomStudentSummary
} from "@odyssey/shared";
import { requestJson } from "./client";

/**
 * Lists students for a teacher-owned classroom.
 */
export async function listClassroomStudents(
  accessToken: string,
  classroomId: string
): Promise<ClassroomStudentSummary[]> {
  const response = await requestJson<ClassroomStudentSummary[]>(
    `/classrooms/${classroomId}/students`,
    {},
    accessToken
  );
  return classroomStudentSummaryListSchema.parse(response);
}

/**
 * Returns inventory and currency for a classroom student.
 */
export async function getClassroomStudentEconomy(
  accessToken: string,
  classroomId: string,
  studentId: string
): Promise<ClassroomStudentEconomy> {
  const response = await requestJson<ClassroomStudentEconomy>(
    `/classrooms/${classroomId}/students/${studentId}/economy`,
    {},
    accessToken
  );
  return classroomStudentEconomySchema.parse(response);
}
