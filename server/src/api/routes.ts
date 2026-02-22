import type { FastifyInstance } from "fastify";
import type { AuthService } from "../auth/AuthService.js";
import type { ClassroomService } from "../classroom/ClassroomService.js";
import type { AppConfig } from "../config.js";
import type { ContainerDefinitionLoader } from "../inventory/ContainerDefinitionLoader.js";
import type { CurrencyService } from "../inventory/CurrencyService.js";
import type { InventoryService } from "../inventory/InventoryService.js";
import type { ItemDefinitionLoader } from "../inventory/ItemDefinitionLoader.js";
import type { LootTableLoader } from "../inventory/LootTableLoader.js";
import type { InviteService } from "../invite/index.js";
import type { TaskCompletionService } from "../task/TaskCompletionService.js";
import type { TaskService } from "../task/TaskService.js";
import { buildAuthenticatePreHandler } from "./middleware/auth.js";
import { requireRole } from "./middleware/role.js";
import { registerDevRoutes } from "./routes/dev.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerClassroomRoutes } from "./routes/classroom.js";
import { registerInviteRoutes } from "./routes/invite.js";
import { registerTaskRoutes } from "./routes/task.js";

interface RouteServices {
  authService: AuthService;
  classroomService: ClassroomService;
  inventoryService: InventoryService;
  currencyService: CurrencyService;
  inviteService: InviteService;
  taskService: TaskService;
  taskCompletionService: TaskCompletionService;
}

export interface DevLoaders {
  itemDefinitionLoader: ItemDefinitionLoader;
  containerDefinitionLoader: ContainerDefinitionLoader;
  lootTableLoader: LootTableLoader;
}

/**
 * Registers API routes for the server.
 * In non-production, optional devLoaders enable the /dev/reload-content endpoint.
 */
export async function registerRoutes(
  app: FastifyInstance,
  services: RouteServices,
  config: AppConfig,
  devLoaders?: DevLoaders
): Promise<void> {
  app.get("/health", async () => ({ status: "ok" }));

  const authenticate = buildAuthenticatePreHandler(services.authService);
  const requireTeacher = requireRole("teacher");

  await registerAuthRoutes(app, services.authService, {
    allowPublicRegistration: config.ALLOW_PUBLIC_REGISTRATION
  });
  await registerClassroomRoutes(
    app,
    services.classroomService,
    services.inventoryService,
    services.currencyService,
    authenticate,
    requireTeacher
  );
  await registerInviteRoutes(
    app,
    services.inviteService,
    authenticate,
    requireTeacher
  );
  await registerTaskRoutes(
    app,
    services.taskService,
    services.taskCompletionService,
    authenticate
  );

  if (process.env.NODE_ENV !== "production" && devLoaders) {
    await registerDevRoutes(
      app,
      config.CONTENT_DIR,
      devLoaders.itemDefinitionLoader,
      devLoaders.containerDefinitionLoader,
      devLoaders.lootTableLoader
    );
  }
}
