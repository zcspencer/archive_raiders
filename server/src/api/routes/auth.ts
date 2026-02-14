import {
  loginRequestSchema,
  registerRequestSchema,
  type AuthResponse
} from "@odyssey/shared";
import type { FastifyInstance } from "fastify";
import type { AuthService } from "../../auth/AuthService.js";

/**
 * Registers authentication API routes.
 */
export async function registerAuthRoutes(
  app: FastifyInstance,
  authService: AuthService
): Promise<void> {
  app.post("/auth/register", async (request, reply) => {
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
