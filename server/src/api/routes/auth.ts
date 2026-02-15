import {
  loginRequestSchema,
  registerRequestSchema,
  type AuthResponse
} from "@odyssey/shared";
import type { FastifyInstance } from "fastify";
import type { AuthService } from "../../auth/AuthService.js";

interface AuthRouteOptions {
  /** When false, POST /auth/register returns 403. Invite-based registration is unaffected. */
  allowPublicRegistration: boolean;
}

/**
 * Registers authentication API routes.
 */
export async function registerAuthRoutes(
  app: FastifyInstance,
  authService: AuthService,
  options: AuthRouteOptions
): Promise<void> {
  /** Public endpoint so clients can hide the register form when self-signup is disabled. */
  app.get("/auth/registration-status", async () => ({
    publicRegistrationEnabled: options.allowPublicRegistration
  }));

  app.post("/auth/register", async (request, reply) => {
    if (!options.allowPublicRegistration) {
      reply.code(403).send({
        error:
          "Public registration is disabled. Please ask your teacher for an invite."
      });
      return;
    }

    const parsed = registerRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: "Invalid register payload" });
      return;
    }
    try {
      const response: AuthResponse = await authService.register(parsed.data);
      reply.code(201).send(response);
    } catch (error) {
      if (error instanceof Error && error.message === "User already exists") {
        reply.code(409).send({ error: error.message });
        return;
      }
      throw error;
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: "Invalid login payload" });
      return;
    }
    try {
      const response: AuthResponse = await authService.login(parsed.data);
      reply.code(200).send(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid credentials") {
        reply.code(401).send({ error: error.message });
        return;
      }
      throw error;
    }
  });
}
