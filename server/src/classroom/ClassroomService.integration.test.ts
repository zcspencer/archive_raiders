import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import type { PostgresDatabase } from "../db/postgres.js";
import { AuthService } from "../auth/AuthService.js";
import { ClassroomService } from "./ClassroomService.js";
import {
  createIntegrationDatabase,
  getIntegrationDatabaseUrl,
  resetIntegrationTables
} from "../test/integration.js";

const runIntegration = getIntegrationDatabaseUrl() ? describe : describe.skip;

runIntegration("ClassroomService integration", () => {
  let db: PostgresDatabase;
  let authService: AuthService;
  let classroomService: ClassroomService;

  beforeAll(async () => {
    db = await createIntegrationDatabase();
    authService = new AuthService(db, "integration-test-secret", 3600);
    classroomService = new ClassroomService(db);
  });

  beforeEach(async () => {
    await resetIntegrationTables(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it("creates and lists classrooms for the owning teacher", async () => {
    const teacher = await authService.register({
      email: "teacher@example.com",
      displayName: "Teacher",
      password: "StrongPassword123!",
      role: "teacher"
    });

    const created = await classroomService.create(teacher.user.id, "Math 101");
    const classrooms = await classroomService.listForUser(teacher.user);

    expect(created.teacherId).toBe(teacher.user.id);
    expect(classrooms.some((room) => room.id === created.id)).toBe(true);
  });

  it("allows students to access only enrolled classrooms", async () => {
    const teacher = await authService.register({
      email: "teacher2@example.com",
      displayName: "Teacher 2",
      password: "StrongPassword123!",
      role: "teacher"
    });
    const student = await authService.register({
      email: "student@example.com",
      displayName: "Student",
      password: "StrongPassword123!",
      role: "student"
    });

    const classroom = await classroomService.create(teacher.user.id, "Science");
    const beforeEnrollment = await classroomService.getByIdForUser(
      student.user,
      classroom.id
    );
    expect(beforeEnrollment).toBeNull();

    await classroomService.addStudentMembership(
      teacher.user.id,
      classroom.id,
      student.user.email
    );

    const listed = await classroomService.listForUser(student.user);
    const visible = await classroomService.getByIdForUser(student.user, classroom.id);
    const hasAccess = await classroomService.isUserInClassroom(student.user, classroom.id);

    expect(listed.some((room) => room.id === classroom.id)).toBe(true);
    expect(visible?.id).toBe(classroom.id);
    expect(hasAccess).toBe(true);
  });

  it("denies access for unenrolled students", async () => {
    const teacher = await authService.register({
      email: "teacher3@example.com",
      displayName: "Teacher 3",
      password: "StrongPassword123!",
      role: "teacher"
    });
    const enrolledStudent = await authService.register({
      email: "student-enrolled@example.com",
      displayName: "Student Enrolled",
      password: "StrongPassword123!",
      role: "student"
    });
    const unenrolledStudent = await authService.register({
      email: "student-unenrolled@example.com",
      displayName: "Student Unenrolled",
      password: "StrongPassword123!",
      role: "student"
    });

    const classroom = await classroomService.create(teacher.user.id, "History");
    await classroomService.addStudentMembership(
      teacher.user.id,
      classroom.id,
      enrolledStudent.user.email
    );

    const visibleToUnenrolled = await classroomService.getByIdForUser(
      unenrolledStudent.user,
      classroom.id
    );
    const hasAccess = await classroomService.isUserInClassroom(
      unenrolledStudent.user,
      classroom.id
    );

    expect(visibleToUnenrolled).toBeNull();
    expect(hasAccess).toBe(false);
  });
});
