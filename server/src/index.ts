import { Encoder } from "@colyseus/schema";
import { WebSocketTransport } from "@colyseus/ws-transport";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { Server } from "colyseus";
import { registerRoutes } from "./api/routes.js";

/* Increase schema buffer for larger state with equipment fields. */
Encoder.BUFFER_SIZE = 40 * 1024;
import { AuthService } from "./auth/AuthService.js";
import { ClassroomService } from "./classroom/ClassroomService.js";
import { ShardRoom } from "./colyseus/rooms/ShardRoom.js";
import { loadConfig } from "./config.js";
import { PostgresDatabase } from "./db/postgres.js";
import {
  ContainerDefinitionLoader,
  ContainerService,
  CurrencyService,
  EquipmentService,
  InventoryService,
  ItemActionResolver,
  ItemDefinitionLoader,
  LootTableLoader,
  LootResolver
} from "./inventory/index.js";
import { EmailService, InviteService } from "./invite/index.js";
import { TaskService } from "./task/TaskService.js";

/**
 * Boots Fastify and Colyseus runtime services.
 */
async function startServer(): Promise<void> {
  const config = loadConfig();
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: config.ALLOWED_ORIGINS });

  const db = new PostgresDatabase(config.DATABASE_URL);
  await db.migrate();

  const authService = new AuthService(db, config.JWT_SECRET, config.JWT_TTL_SECONDS);
  const classroomService = new ClassroomService(db);
  const emailService = new EmailService({
    awsRegion: config.AWS_REGION,
    fromEmail: config.SES_FROM_EMAIL
  });
  const inviteService = new InviteService(
    db,
    authService,
    classroomService,
    emailService,
    config.INVITE_URL_BASE
  );
  const taskService = new TaskService(classroomService, config.CONTENT_DIR);

  const inventoryService = new InventoryService(db);
  const equipmentService = new EquipmentService(db);
  const currencyService = new CurrencyService(db);
  const itemDefinitionLoader = new ItemDefinitionLoader(config.CONTENT_DIR);
  const containerDefinitionLoader = new ContainerDefinitionLoader(config.CONTENT_DIR);
  await itemDefinitionLoader.loadAll();
  await containerDefinitionLoader.loadAll();
  const lootTableLoader = new LootTableLoader(config.CONTENT_DIR);
  await lootTableLoader.loadAll();
  const lootResolver = new LootResolver(lootTableLoader, itemDefinitionLoader);
  const containerService = new ContainerService(
    db,
    containerDefinitionLoader,
    itemDefinitionLoader,
    inventoryService,
    currencyService,
    lootResolver
  );
  const itemActionResolver = new ItemActionResolver(
    itemDefinitionLoader,
    inventoryService,
    equipmentService
  );

  await registerRoutes(
    app,
    {
      authService,
      classroomService,
      inventoryService,
      currencyService,
      inviteService,
      taskService
    },
    config,
    {
      itemDefinitionLoader,
      containerDefinitionLoader,
      lootTableLoader
    }
  );

  const gameServer = new Server({
    transport: new WebSocketTransport({ server: app.server })
  });
  ShardRoom.configureServices({
    authService,
    classroomService,
    containerService,
    inventoryService,
    currencyService,
    equipmentService,
    itemActionResolver,
    itemDefinitionLoader
  });
  gameServer.define("shard", ShardRoom);

  app.addHook("onClose", async () => {
    await db.close();
  });

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
}

startServer().catch((error: unknown) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
