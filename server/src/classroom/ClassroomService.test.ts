import type { AuthUser } from "@odyssey/shared";
import { describe, expect, it, vi } from "vitest";
import type { PostgresDatabase } from "../db/postgres.js";
import {
  ClassroomOwnershipError,
  ClassroomService,
  InvalidMembershipTargetError,
  StudentNotFoundError
} from "./ClassroomService.js";

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

  it("lists classrooms scoped to student memberships", async () => {
    const db = createDbMock();
    const queryMock = vi.mocked(db.query);
    queryMock.mockResolvedValueOnce([
      {
        id: "class-1",
        teacher_id: teacherUser.id,
        name: "Math 101",
        created_at: new Date("2026-01-01T00:00:00.000Z")
      }
    ]);

    const service = new ClassroomService(db);
    const classrooms = await service.listForUser(studentUser);

    expect(classrooms).toHaveLength(1);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("classroom_memberships"), [
      studentUser.id
    ]);
  });

  it("returns null when classroom is not visible to user", async () => {
    const db = createDbMock();
    vi.mocked(db.query).mockResolvedValueOnce([]);

    const service = new ClassroomService(db);
    const classroom = await service.getByIdForUser(studentUser, "missing-id");

    expect(classroom).toBeNull();
  });

  it("returns membership visibility for a classroom", async () => {
    const db = createDbMock();
    const queryMock = vi.mocked(db.query);
    queryMock.mockResolvedValueOnce([{ allowed: 1 }]);
    queryMock.mockResolvedValueOnce([]);

    const service = new ClassroomService(db);
    await expect(service.isUserInClassroom(teacherUser, "class-1")).resolves.toBe(
      true
    );
    await expect(service.isUserInClassroom(studentUser, "class-1")).resolves.toBe(
      false
    );
  });

  it("enrolls a student for a teacher-owned classroom", async () => {
    const db = createDbMock();
    const queryMock = vi.mocked(db.query);
    queryMock.mockResolvedValueOnce([{ id: "class-1" }]);
    queryMock.mockResolvedValueOnce([{ id: studentUser.id, role: "student" }]);
    queryMock.mockResolvedValueOnce([
      {
        classroom_id: "class-1",
        user_id: studentUser.id,
        created_at: new Date("2026-01-01T00:00:00.000Z")
      }
    ]);

    const service = new ClassroomService(db);
    const membership = await service.addStudentMembership(
      teacherUser.id,
      "class-1",
      studentUser.email
    );

    expect(membership.classroomId).toBe("class-1");
    expect(membership.userId).toBe(studentUser.id);
  });

  it("rejects enrollment when classroom is not teacher-owned", async () => {
    const db = createDbMock();
    vi.mocked(db.query).mockResolvedValueOnce([]);

    const service = new ClassroomService(db);

    await expect(
      service.addStudentMembership(teacherUser.id, "class-1", studentUser.email)
    ).rejects.toBeInstanceOf(ClassroomOwnershipError);
  });

  it("rejects enrollment when student email is unknown", async () => {
    const db = createDbMock();
    const queryMock = vi.mocked(db.query);
    queryMock.mockResolvedValueOnce([{ id: "class-1" }]);
    queryMock.mockResolvedValueOnce([]);

    const service = new ClassroomService(db);

    await expect(
      service.addStudentMembership(teacherUser.id, "class-1", "missing@example.com")
    ).rejects.toBeInstanceOf(StudentNotFoundError);
  });

  it("rejects enrollment when target user is not a student", async () => {
    const db = createDbMock();
    const queryMock = vi.mocked(db.query);
    queryMock.mockResolvedValueOnce([{ id: "class-1" }]);
    queryMock.mockResolvedValueOnce([{ id: teacherUser.id, role: "teacher" }]);

    const service = new ClassroomService(db);

    await expect(
      service.addStudentMembership(teacherUser.id, "class-1", teacherUser.email)
    ).rejects.toBeInstanceOf(InvalidMembershipTargetError);
  });
});
