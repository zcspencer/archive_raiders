import { type Classroom } from "@odyssey/shared";
/**
 * Lists classrooms for the signed-in teacher.
 */
export declare function listClassrooms(accessToken: string): Promise<Classroom[]>;
/**
 * Creates a classroom for the signed-in teacher.
 */
export declare function createClassroom(accessToken: string, name: string): Promise<Classroom>;
//# sourceMappingURL=classrooms.d.ts.map