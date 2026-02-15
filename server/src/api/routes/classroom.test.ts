import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import type { AuthUser } from "@odyssey/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ClassroomOwnershipError,
  InvalidMembershipTargetError,
  StudentNotFoundError,
  type ClassroomService
} from "../../classroom/ClassroomService.js";
import type { CurrencyService } from "../../inventory/CurrencyService.js";
import type { InventoryService } from "../../inventory/InventoryService.js";
import { registerClassroomRoutes } from "./classroom.js";

describe("classroom routes", () => {
  const apps: Array<ReturnType<typeof Fastify>> = [];

  afterEach(async () => {
    await Promise.all(apps.map(async (app) => app.close()));
  });

  it("creates classroom memberships for teachers", async () => {
    const classroomService = {
      create: vi.fn(),
      listForUser: vi.fn(),
      getByIdForUser: vi.fn(),
      addStudentMembership: vi.fn().mockResolvedValue({
        classroomId: "class-1",
        userId: "student-1",
        createdAt: "2026-01-01T00:00:00.000Z"
      })
    } as unknown as ClassroomService;

    const app = await buildApp(classroomService, {
      id: "teacher-1",
      email: "teacher@example.com",
      displayName: "Teacher",
      role: "teacher"
    });
    const response = await app.inject({
      method: "POST",
      url: "/classrooms/class-1/memberships",
      payload: { studentEmail: "student@example.com" }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().userId).toBe("student-1");
  });

  it("returns 404 when teacher does not own classroom", async () => {
    const classroomService = {
      create: vi.fn(),
      listForUser: vi.fn(),
      getByIdForUser: vi.fn(),
      addStudentMembership: vi
        .fn()
        .mockRejectedValue(new ClassroomOwnershipError("class-1"))
    } as unknown as ClassroomService;

    const app = await buildApp(classroomService, {
      id: "teacher-1",
      email: "teacher@example.com",
      displayName: "Teacher",
      role: "teacher"
    });
    const response = await app.inject({
      method: "POST",
      url: "/classrooms/class-1/memberships",
      payload: { studentEmail: "student@example.com" }
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 404 when target student is missing", async () => {
    const classroomService = {
      create: vi.fn(),
      listForUser: vi.fn(),
      getByIdForUser: vi.fn(),
      addStudentMembership: vi
        .fn()
        .mockRejectedValue(new StudentNotFoundError("missing@example.com"))
    } as unknown as ClassroomService;

    const app = await buildApp(classroomService, {
      id: "teacher-1",
      email: "teacher@example.com",
      displayName: "Teacher",
      role: "teacher"
    });
    const response = await app.inject({
      method: "POST",
      url: "/classrooms/class-1/memberships",
      payload: { studentEmail: "missing@example.com" }
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 400 for invalid enrollment target role", async () => {
    const classroomService = {
      create: vi.fn(),
      listForUser: vi.fn(),
      getByIdForUser: vi.fn(),
      addStudentMembership: vi
        .fn()
        .mockRejectedValue(new InvalidMembershipTargetError("teacher@example.com"))
    } as unknown as ClassroomService;

    const app = await buildApp(classroomService, {
      id: "teacher-1",
      email: "teacher@example.com",
      displayName: "Teacher",
      role: "teacher"
    });
    const response = await app.inject({
      method: "POST",
      url: "/classrooms/class-1/memberships",
      payload: { studentEmail: "teacher@example.com" }
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 403 for student enrollment attempts", async () => {
    const classroomService = {
      create: vi.fn(),
      listForUser: vi.fn(),
      getByIdForUser: vi.fn(),
      addStudentMembership: vi.fn()
    } as unknown as ClassroomService;

    const app = await buildApp(classroomService, {
      id: "student-1",
      email: "student@example.com",
      displayName: "Student",
      role: "student"
    });
    const response = await app.inject({
      method: "POST",
      url: "/classrooms/class-1/memberships",
      payload: { studentEmail: "student2@example.com" }
    });

    expect(response.statusCode).toBe(403);
  });

  it("returns classroom students for teachers", async () => {
    const classroomService = {
      create: vi.fn(),
      listForUser: vi.fn(),
      getByIdForUser: vi.fn().mockResolvedValue({
        id: "class-1",
        name: "Class 1",
        teacherId: "teacher-1",
        createdAt: "2026-01-01T00:00:00.000Z"
      }),
      addStudentMembership: vi.fn(),
      listStudentsForTeacher: vi.fn().mockResolvedValue([
        {
          userId: "student-1",
          email: "student@example.com",
          displayName: "Student",
          membershipCreatedAt: "2026-01-01T00:00:00.000Z"
        }
      ]),
      isStudentInTeacherClassroom: vi.fn()
    } as unknown as ClassroomService;

    const app = await buildApp(classroomService, {
      id: "teacher-1",
      email: "teacher@example.com",
      displayName: "Teacher",
      role: "teacher"
    });
    const response = await app.inject({
      method: "GET",
      url: "/classrooms/class-1/students"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);
  });

  it("returns student economy for teacher-owned classroom student", async () => {
    const classroomService = {
      create: vi.fn(),
      listForUser: vi.fn(),
      getByIdForUser: vi.fn(),
      addStudentMembership: vi.fn(),
      listStudentsForTeacher: vi.fn(),
      isStudentInTeacherClassroom: vi.fn().mockResolvedValue(true)
    } as unknown as ClassroomService;
    const inventoryService = {
      getInventory: vi.fn().mockResolvedValue([])
    } as unknown as InventoryService;
    const currencyService = {
      getBalances: vi.fn().mockResolvedValue({ coins: 20, museum_points: 5 })
    } as unknown as CurrencyService;

    const app = await buildApp(
      classroomService,
      {
        id: "teacher-1",
        email: "teacher@example.com",
        displayName: "Teacher",
        role: "teacher"
      },
      inventoryService,
      currencyService
    );
    const response = await app.inject({
      method: "GET",
      url: "/classrooms/class-1/students/student-1/economy"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().currency.coins).toBe(20);
  });

  async function buildApp(
    classroomService: ClassroomService,
    authUser: AuthUser,
    inventoryService?: InventoryService,
    currencyService?: CurrencyService
  ): Promise<ReturnType<typeof Fastify>> {
    const app = Fastify();
    apps.push(app);

    await registerClassroomRoutes(
      app,
      classroomService,
      (inventoryService ?? {
        getInventory: vi.fn().mockResolvedValue([])
      }) as InventoryService,
      (currencyService ?? {
        getBalances: vi.fn().mockResolvedValue({ coins: 0, museum_points: 0 })
      }) as CurrencyService,
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
