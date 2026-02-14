import { classroomListSchema, classroomSchema, createClassroomRequestSchema } from "@odyssey/shared";
import { requestJson } from "./client";
/**
 * Lists classrooms for the signed-in teacher.
 */
export async function listClassrooms(accessToken) {
    const response = await requestJson("/classrooms", {}, accessToken);
    return classroomListSchema.parse(response);
}
/**
 * Creates a classroom for the signed-in teacher.
 */
export async function createClassroom(accessToken, name) {
    const payload = createClassroomRequestSchema.parse({ name });
    const response = await requestJson("/classrooms", {
        method: "POST",
        body: JSON.stringify(payload)
    }, accessToken);
    return classroomSchema.parse(response);
}
//# sourceMappingURL=classrooms.js.map