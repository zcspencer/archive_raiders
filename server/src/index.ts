import { WebSocketTransport } from "@colyseus/ws-transport";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { Server } from "colyseus";
import { registerRoutes } from "./api/routes.js";
import { AuthService } from "./auth/AuthService.js";
import { ClassroomService } from "./classroom/ClassroomService.js";
import { ShardRoom } from "./colyseus/rooms/ShardRoom.js";
import { loadConfig } from "./config.js";
import { PostgresDatabase } from "./db/postgres.js";
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
  const taskService = new TaskService(classroomService, config.CONTENT_DIR);

  await registerRoutes(app, { authService, classroomService, taskService });

  const gameServer = new Server({
    transport: new WebSocketTransport({ server: app.server })
  });
  ShardRoom.configureServices({ authService, classroomService });
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
