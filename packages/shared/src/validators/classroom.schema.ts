import { z } from "zod";

export const createClassroomRequestSchema = z.object({
  name: z.string().min(1).max(120)
});

export const classroomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  teacherId: z.string().min(1),
  createdAt: z.string().datetime()
});

export const classroomListSchema = z.array(classroomSchema);
