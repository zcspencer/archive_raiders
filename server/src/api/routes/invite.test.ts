import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import type { AuthUser } from "@odyssey/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InviteService } from "../../invite/index.js";
import { registerInviteRoutes } from "./invite.js";

describe("invite routes", () => {
  const apps: Array<ReturnType<typeof Fastify>> = [];

  afterEach(async () => {
    await Promise.all(apps.map(async (app) => app.close()));
  });

  it("returns classroom invites for teachers", async () => {
    const inviteService = {
      createInvite: vi.fn(),
      listInvitesForTeacher: vi.fn().mockResolvedValue([
        {
          id: "invite-1",
          email: "student@example.com",
          token: "token-1",
          createdAt: "2026-01-01T00:00:00.000Z",
          expiresAt: "2026-01-08T00:00:00.000Z",
          acceptedAt: null
        }
      ]),
      getInviteByToken: vi.fn(),
      acceptInvite: vi.fn()
    } as unknown as InviteService;

    const app = await buildApp(inviteService, {
      id: "teacher-1",
      email: "teacher@example.com",
      displayName: "Teacher",
      role: "teacher"
    });
    const response = await app.inject({
      method: "GET",
      url: "/classrooms/class-1/invites"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);
  });

  it("returns 403 for student invite listing attempts", async () => {
    const inviteService = {
      createInvite: vi.fn(),
      listInvitesForTeacher: vi.fn(),
      getInviteByToken: vi.fn(),
      acceptInvite: vi.fn()
    } as unknown as InviteService;

    const app = await buildApp(inviteService, {
      id: "student-1",
      email: "student@example.com",
      displayName: "Student",
      role: "student"
    });
    const response = await app.inject({
      method: "GET",
      url: "/classrooms/class-1/invites"
    });

    expect(response.statusCode).toBe(403);
  });

  async function buildApp(
    inviteService: InviteService,
    authUser: AuthUser
  ): Promise<ReturnType<typeof Fastify>> {
    const app = Fastify();
    apps.push(app);

    await registerInviteRoutes(
      app,
      inviteService,
      async (request: FastifyRequest): Promise<void> => {
        request.authUser = authUser;
      },
      async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        if (request.authUser?.role !== "teacher") {
          reply.code(403).send({ error: "Insufficient role" });
        }
      }
    );
    await app.ready();
    return app;
  }
});
