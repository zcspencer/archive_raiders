import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ClassroomAccessError,
  TaskNotFoundError,
  type TaskService
} from "../../task/TaskService.js";
import { registerTaskRoutes } from "./task.js";

describe("task routes", () => {
  const apps: Array<ReturnType<typeof Fastify>> = [];

  afterEach(async () => {
    await Promise.all(apps.map(async (app) => app.close()));
  });

  it("returns a task result for valid submissions", async () => {
    const taskService = {
      submit: vi.fn().mockResolvedValue({
        isCorrect: true,
        score: 100,
        feedback: "Correct shortcut applied."
      })
    } as unknown as TaskService;

    const app = await buildApp(taskService);
    const response = await app.inject({
      method: "POST",
      url: "/tasks/shortcut-ctrl-f/submit",
      payload: {
        classroomId: "class-1",
        answer: { pressedKeys: "ctrl+f" }
      },
      headers: {
        authorization: "Bearer test-token"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().isCorrect).toBe(true);
  });

  it("returns 404 when the task id is unknown", async () => {
    const taskService = {
      submit: vi.fn().mockRejectedValue(new TaskNotFoundError("missing-task"))
    } as unknown as TaskService;

    const app = await buildApp(taskService);
    const response = await app.inject({
      method: "POST",
      url: "/tasks/missing-task/submit",
      payload: {
        classroomId: "class-1",
        answer: { pressedKeys: "ctrl+f" }
      },
      headers: {
        authorization: "Bearer test-token"
      }
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 403 when classroom access is denied", async () => {
    const taskService = {
      submit: vi.fn().mockRejectedValue(new ClassroomAccessError("class-1"))
    } as unknown as TaskService;

    const app = await buildApp(taskService);
    const response = await app.inject({
      method: "POST",
      url: "/tasks/shortcut-ctrl-f/submit",
      payload: {
        classroomId: "class-1",
        answer: { pressedKeys: "ctrl+f" }
      },
      headers: {
        authorization: "Bearer test-token"
      }
    });

    expect(response.statusCode).toBe(403);
  });

  it("returns 400 for invalid payloads", async () => {
    const taskService = {
      submit: vi.fn()
    } as unknown as TaskService;

    const app = await buildApp(taskService);
    const response = await app.inject({
      method: "POST",
      url: "/tasks/shortcut-ctrl-f/submit",
      payload: {
        classroomId: "",
        answer: "invalid"
      },
      headers: {
        authorization: "Bearer test-token"
      }
    });

    expect(response.statusCode).toBe(400);
  });

  async function buildApp(taskService: TaskService): Promise<ReturnType<typeof Fastify>> {
    const app = Fastify();
    apps.push(app);

    await registerTaskRoutes(app, taskService, authenticate);
    await app.ready();
    return app;
  }
});

async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  void _reply;
  request.authUser = {
    id: "user-1",
    email: "user@example.com",
    displayName: "User",
    role: "student"
  };
}
