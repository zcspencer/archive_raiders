import { z } from "zod";

export const playerProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  role: z.enum(["student", "teacher"]),
  classroomId: z.string().min(1).nullable()
});
