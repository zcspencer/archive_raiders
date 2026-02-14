import { z } from "zod";

/** Schema for creating a classroom invite. */
export const createInviteRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320)
});

/** Schema for accepting an invite. */
export const acceptInviteRequestSchema = z.object({
  displayName: z.string().min(1).max(100),
  password: z.string().min(8).max(128)
});

/** Schema for public invite info returned to clients. */
export const inviteInfoSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  classroomName: z.string().min(1),
  expiresAt: z.string().datetime()
});
