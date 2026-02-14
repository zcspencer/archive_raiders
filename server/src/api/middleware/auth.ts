import type { AuthUser } from "@odyssey/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthService } from "../../auth/AuthService.js";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}

/**
 * Builds a pre-handler that authenticates bearer tokens.
 */
export function buildAuthenticatePreHandler(authService: AuthService) {
  return async function authenticate(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      reply.code(401).send({ error: "Missing bearer token" });
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    const user = authService.getUserFromAccessToken(token);
    if (!user) {
      reply.code(401).send({ error: "Invalid token" });
      return;
    }

    request.authUser = user;
  };
}
