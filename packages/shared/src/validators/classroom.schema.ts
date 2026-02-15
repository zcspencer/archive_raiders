import { z } from "zod";
import { currencyBalancesSchema } from "./currency.schema.js";
import { itemInstanceSchema } from "./inventory.schema.js";

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

export const classroomStudentSummarySchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().max(320),
  displayName: z.string().min(1).max(100),
  membershipCreatedAt: z.string().datetime()
});

export const classroomStudentSummaryListSchema = z.array(classroomStudentSummarySchema);

export const classroomStudentEconomySchema = z.object({
  inventory: z.array(itemInstanceSchema),
  currency: currencyBalancesSchema
});
