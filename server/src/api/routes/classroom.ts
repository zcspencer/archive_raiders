import {
  classroomListSchema,
  classroomMembershipSchema,
  classroomStudentEconomySchema,
  classroomStudentSummaryListSchema,
  classroomSchema,
  createClassroomMembershipRequestSchema,
  createClassroomRequestSchema
} from "@odyssey/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  ClassroomOwnershipError,
  InvalidMembershipTargetError,
  StudentNotFoundError,
  type ClassroomService
} from "../../classroom/ClassroomService.js";
import type { CurrencyService } from "../../inventory/CurrencyService.js";
import type { InventoryService } from "../../inventory/InventoryService.js";

type AuthPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

/**
 * Registers classroom API routes.
 */
export async function registerClassroomRoutes(
  app: FastifyInstance,
  classroomService: ClassroomService,
  inventoryService: InventoryService,
  currencyService: CurrencyService,
  authenticate: AuthPreHandler,
  requireTeacher: AuthPreHandler
): Promise<void> {
  app.post(
    "/classrooms",
    { preHandler: [authenticate, requireTeacher] },
    async (request, reply) => {
      const parsed = createClassroomRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        reply.code(400).send({ error: "Invalid classroom payload" });
        return;
      }

      const user = request.authUser;
      if (!user) {
        reply.code(401).send({ error: "Authentication required" });
        return;
      }

      const classroom = await classroomService.create(user.id, parsed.data.name);
      reply.code(201).send(classroomSchema.parse(classroom));
    }
  );

  app.get("/classrooms", { preHandler: [authenticate] }, async (request) => {
    const user = request.authUser;
    if (!user) {
      return [];
    }
    const classrooms = await classroomService.listForUser(user);
    return classroomListSchema.parse(classrooms);
  });

  app.get(
    "/classrooms/:classroomId",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.authUser;
      if (!user) {
        reply.code(401).send({ error: "Authentication required" });
        return;
      }

      const params = request.params as { classroomId?: string };
      const classroomId = params.classroomId;
      if (!classroomId) {
        reply.code(400).send({ error: "Missing classroom id" });
        return;
      }

      const classroom = await classroomService.getByIdForUser(user, classroomId);
      if (!classroom) {
        reply.code(404).send({ error: "Classroom not found" });
        return;
      }
      reply.code(200).send(classroomSchema.parse(classroom));
    }
  );

  app.post(
    "/classrooms/:classroomId/memberships",
    { preHandler: [authenticate, requireTeacher] },
    async (request, reply) => {
      const user = request.authUser;
      if (!user) {
        reply.code(401).send({ error: "Authentication required" });
        return;
      }

      const params = request.params as { classroomId?: string };
      const classroomId = params.classroomId;
      if (!classroomId) {
        reply.code(400).send({ error: "Missing classroom id" });
        return;
      }

      const parsed = createClassroomMembershipRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        reply.code(400).send({ error: "Invalid classroom membership payload" });
        return;
      }

      try {
        const membership = await classroomService.addStudentMembership(
          user.id,
          classroomId,
          parsed.data.studentEmail
        );
        reply.code(201).send(classroomMembershipSchema.parse(membership));
      } catch (error) {
        if (error instanceof ClassroomOwnershipError) {
          reply.code(404).send({ error: "Classroom not found" });
          return;
        }
        if (error instanceof StudentNotFoundError) {
          reply.code(404).send({ error: "Student not found" });
          return;
        }
        if (error instanceof InvalidMembershipTargetError) {
          reply.code(400).send({ error: "Enrollment target must be a student" });
          return;
        }

        throw error;
      }
    }
  );

  app.get(
    "/classrooms/:classroomId/students",
    { preHandler: [authenticate, requireTeacher] },
    async (request, reply) => {
      const user = request.authUser;
      if (!user) {
        reply.code(401).send({ error: "Authentication required" });
        return;
      }
      const params = request.params as { classroomId?: string };
      const classroomId = params.classroomId;
      if (!classroomId) {
        reply.code(400).send({ error: "Missing classroom id" });
        return;
      }

      const classroom = await classroomService.getByIdForUser(
        { id: user.id, email: user.email, displayName: user.displayName, role: "teacher" },
        classroomId
      );
      if (!classroom) {
        reply.code(404).send({ error: "Classroom not found" });
        return;
      }

      const students = await classroomService.listStudentsForTeacher(user.id, classroomId);
      reply.code(200).send(classroomStudentSummaryListSchema.parse(students));
    }
  );

  app.get(
    "/classrooms/:classroomId/students/:studentId/economy",
    { preHandler: [authenticate, requireTeacher] },
    async (request, reply) => {
      const user = request.authUser;
      if (!user) {
        reply.code(401).send({ error: "Authentication required" });
        return;
      }
      const params = request.params as { classroomId?: string; studentId?: string };
      const classroomId = params.classroomId;
      const studentId = params.studentId;
      if (!classroomId || !studentId) {
        reply.code(400).send({ error: "Missing required route params" });
        return;
      }

      const isMember = await classroomService.isStudentInTeacherClassroom(
        user.id,
        classroomId,
        studentId
      );
      if (!isMember) {
        reply.code(404).send({ error: "Student not found in classroom" });
        return;
      }

      const [inventory, currency] = await Promise.all([
        inventoryService.getInventory(studentId),
        currencyService.getBalances(studentId)
      ]);
      reply.code(200).send(classroomStudentEconomySchema.parse({ inventory, currency }));
    }
  );
}
