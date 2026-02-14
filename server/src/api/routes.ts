import type { FastifyInstance } from "fastify";
import type { AuthService } from "../auth/AuthService.js";
import type { ClassroomService } from "../classroom/ClassroomService.js";
import type { InviteService } from "../invite/index.js";
import type { TaskService } from "../task/TaskService.js";
import { buildAuthenticatePreHandler } from "./middleware/auth.js";
import { requireRole } from "./middleware/role.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerClassroomRoutes } from "./routes/classroom.js";
import { registerInviteRoutes } from "./routes/invite.js";
import { registerTaskRoutes } from "./routes/task.js";

interface RouteServices {
  authService: AuthService;
  classroomService: ClassroomService;
  inviteService: InviteService;
  taskService: TaskService;
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
  await registerInviteRoutes(
    app,
    services.inviteService,
    authenticate,
    requireTeacher
  );
  await registerTaskRoutes(app, services.taskService, authenticate);
}
