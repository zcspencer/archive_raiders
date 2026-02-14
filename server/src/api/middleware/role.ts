import type { UserRole } from "@odyssey/shared";
import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Requires the authenticated user to hold a specific role.
 */
export function requireRole(role: UserRole) {
  return async function requireRolePreHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.authUser) {
      reply.code(401).send({ error: "Authentication required" });
      return;
    }
    if (request.authUser.role !== role) {
      reply.code(403).send({ error: "Insufficient role" });
    }
  };
}
