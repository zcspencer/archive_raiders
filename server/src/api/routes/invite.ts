import {
  acceptInviteRequestSchema,
  createInviteRequestSchema,
  inviteInfoSchema
} from "@odyssey/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  EmailAlreadyRegisteredError,
  InviteAlreadyAcceptedError,
  InviteNotFoundError,
  type InviteService
} from "../../invite/index.js";

type AuthPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

/**
 * Registers invite API routes.
 */
export async function registerInviteRoutes(
  app: FastifyInstance,
  inviteService: InviteService,
  authenticate: AuthPreHandler,
  requireTeacher: AuthPreHandler
): Promise<void> {
  /* ── Teacher creates an invite ──────────────────────────────────────── */
  app.post(
    "/classrooms/:classroomId/invites",
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

      const parsed = createInviteRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        reply.code(400).send({ error: "Invalid invite payload" });
        return;
      }

      try {
        const invite = await inviteService.createInvite(
          user.id,
          user.displayName,
          classroomId,
          parsed.data.email
        );
        reply.code(201).send(inviteInfoSchema.parse(invite));
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          reply.code(404).send({ error: "Classroom not found" });
          return;
        }
        throw error;
      }
    }
  );

  /* ── Public: get invite info by token ───────────────────────────────── */
  app.get("/invites/:token", async (request, reply) => {
    const params = request.params as { token?: string };
    const token = params.token;
    if (!token) {
      reply.code(400).send({ error: "Missing invite token" });
      return;
    }

    try {
      const info = await inviteService.getInviteByToken(token);
      reply.code(200).send(inviteInfoSchema.parse(info));
    } catch (error) {
      if (error instanceof InviteNotFoundError) {
        reply.code(404).send({ error: "Invite not found or expired" });
        return;
      }
      if (error instanceof InviteAlreadyAcceptedError) {
        reply.code(410).send({ error: "Invite has already been accepted" });
        return;
      }
      throw error;
    }
  });

  /* ── Public: accept an invite ───────────────────────────────────────── */
  app.post("/invites/:token/accept", async (request, reply) => {
    const params = request.params as { token?: string };
    const token = params.token;
    if (!token) {
      reply.code(400).send({ error: "Missing invite token" });
      return;
    }

    const parsed = acceptInviteRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: "Invalid accept invite payload" });
      return;
    }

    try {
      const authResponse = await inviteService.acceptInvite(
        token,
        parsed.data.displayName,
        parsed.data.password
      );
      reply.code(201).send(authResponse);
    } catch (error) {
      if (error instanceof InviteNotFoundError) {
        reply.code(404).send({ error: "Invite not found or expired" });
        return;
      }
      if (error instanceof InviteAlreadyAcceptedError) {
        reply.code(410).send({ error: "Invite has already been accepted" });
        return;
      }
      if (error instanceof EmailAlreadyRegisteredError) {
        reply.code(409).send({ error: error.message });
        return;
      }
      throw error;
    }
  });
}
