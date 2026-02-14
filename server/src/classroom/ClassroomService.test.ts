import type { AuthUser } from "@odyssey/shared";
import { describe, expect, it, vi } from "vitest";
import type { PostgresDatabase } from "../db/postgres.js";
import { ClassroomService } from "./ClassroomService.js";

function createDbMock() {
  return {
    query: vi.fn()
  } as unknown as PostgresDatabase;
}

const teacherUser: AuthUser = {
  id: "teacher-1",
  email: "teacher@example.com",
  displayName: "Teacher",
  role: "teacher"
};

const studentUser: AuthUser = {
  id: "student-1",
  email: "student@example.com",
  displayName: "Student",
  role: "student"
};

describe("ClassroomService", () => {
  it("creates a classroom and maps DB fields", async () => {
    const db = createDbMock();
    vi.mocked(db.query).mockResolvedValueOnce([
      {
        id: "class-1",
        teacher_id: teacherUser.id,
        name: "Math 101",
        created_at: new Date("2026-01-01T00:00:00.000Z")
      }
    ]);

    const service = new ClassroomService(db);
    const classroom = await service.create(teacherUser.id, "Math 101");

    expect(classroom.teacherId).toBe(teacherUser.id);
    expect(classroom.name).toBe("Math 101");
    expect(classroom.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("lists classrooms scoped to teacher", async () => {
    const db = createDbMock();
    vi.mocked(db.query).mockResolvedValueOnce([
      {
        id: "class-1",
        teacher_id: teacherUser.id,
        name: "Math 101",
        created_at: new Date("2026-01-01T00:00:00.000Z")
      }
    ]);

    const service = new ClassroomService(db);
    const classrooms = await service.listForUser(teacherUser);

    expect(classrooms).toHaveLength(1);
    expect(classrooms[0]?.teacherId).toBe(teacherUser.id);
  });

  it("returns null when classroom is not visible to user", async () => {
    const db = createDbMock();
    vi.mocked(db.query).mockResolvedValueOnce([]);

    const service = new ClassroomService(db);
    const classroom = await service.getByIdForUser(studentUser, "missing-id");

    expect(classroom).toBeNull();
  });
});
