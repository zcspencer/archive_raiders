import type { TaskResult } from "@odyssey/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  ClassroomAccessError,
  TaskNotFoundError,
  type TaskService
} from "../../task/TaskService.js";
import type { TaskCompletionService } from "../../task/TaskCompletionService.js";

type AuthPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

const submitTaskBodySchema = z.object({
  classroomId: z.string().min(1),
  answer: z.record(z.unknown()),
  attemptId: z.string().uuid(),
  startedAt: z.string().datetime().optional()
});

/**
 * Registers task submission and completions API routes.
 */
export async function registerTaskRoutes(
  app: FastifyInstance,
  taskService: TaskService,
  taskCompletionService: TaskCompletionService,
  authenticate: AuthPreHandler
): Promise<void> {
  app.post("/tasks/:taskId/submit", { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.authUser;
    if (!user) {
      reply.code(401).send({ error: "Authentication required" });
      return;
    }

    const params = request.params as { taskId?: string };
    const taskId = params.taskId;
    if (!taskId) {
      reply.code(400).send({ error: "Missing task id" });
      return;
    }

    const parsedBody = submitTaskBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.code(400).send({ error: "Invalid task submission payload" });
      return;
    }

    try {
      const result: TaskResult = await taskService.submit(
        user,
        taskId,
        parsedBody.data.classroomId,
        parsedBody.data.answer,
        parsedBody.data.attemptId,
        parsedBody.data.startedAt ?? null
      );
      reply.code(200).send(result);
    } catch (error) {
      if (error instanceof TaskNotFoundError) {
        reply.code(404).send({ error: error.message });
        return;
      }
      if (error instanceof ClassroomAccessError) {
        reply.code(403).send({ error: error.message });
        return;
      }
      throw error;
    }
  });

  app.get("/tasks/completions", { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.authUser;
    if (!user) {
      reply.code(401).send({ error: "Authentication required" });
      return;
    }

    const taskIds = await taskCompletionService.getCompletedTaskIds(user.id);
    reply.code(200).send({ taskIds });
  });
}
