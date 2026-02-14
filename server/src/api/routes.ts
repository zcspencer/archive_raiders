import type { FastifyInstance } from "fastify";
import type { AuthService } from "../auth/AuthService.js";
import type { ClassroomService } from "../classroom/ClassroomService.js";
import { buildAuthenticatePreHandler } from "./middleware/auth.js";
import { requireRole } from "./middleware/role.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerClassroomRoutes } from "./routes/classroom.js";

interface RouteServices {
  authService: AuthService;
  classroomService: ClassroomService;
}

/**
 * Registers API routes for the server.
 */
export async function registerRoutes(
  app: FastifyInstance,
  services: RouteServices
): Promise<void> {
  app.get("/health", async () => ({ status: "ok" }));

  const authenticate = buildAuthenticatePreHandler(services.authService);
  const requireTeacher = requireRole("teacher");

  await registerAuthRoutes(app, services.authService);
  await registerClassroomRoutes(
    app,
    services.classroomService,
    authenticate,
    requireTeacher
  );
}
