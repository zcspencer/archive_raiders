import { z } from "zod";

export const createClassroomRequestSchema = z.object({
  name: z.string().min(1).max(120)
});

export const createClassroomMembershipRequestSchema = z.object({
  studentEmail: z.string().trim().toLowerCase().email().max(320)
});

export const classroomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  teacherId: z.string().min(1),
  createdAt: z.string().datetime()
});

export const classroomMembershipSchema = z.object({
  classroomId: z.string().min(1),
  userId: z.string().min(1),
  createdAt: z.string().datetime()
});

export const classroomListSchema = z.array(classroomSchema);
