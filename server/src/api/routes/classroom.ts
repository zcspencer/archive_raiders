import {
  classroomListSchema,
  classroomSchema,
  createClassroomRequestSchema
} from "@odyssey/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ClassroomService } from "../../classroom/ClassroomService.js";

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
}
