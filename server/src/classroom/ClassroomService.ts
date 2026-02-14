import { randomUUID } from "node:crypto";
import type { AuthUser, Classroom, ClassroomMembership } from "@odyssey/shared";
import type { PostgresDatabase } from "../db/postgres.js";

/**
 * Error raised when the teacher cannot manage the target classroom.
 */
export class ClassroomOwnershipError extends Error {
  constructor(classroomId: string) {
    super(`Classroom not found for teacher: ${classroomId}`);
  }
}

/**
 * Error raised when a requested student account does not exist.
 */
export class StudentNotFoundError extends Error {
  constructor(studentEmail: string) {
    super(`Student not found: ${studentEmail}`);
  }
}

/**
 * Error raised when enrollment target is not a student account.
 */
export class InvalidMembershipTargetError extends Error {
  constructor(studentEmail: string) {
    super(`User is not a student: ${studentEmail}`);
  }
}

/**
 * Provides persisted classroom operations in PostgreSQL.
 */
export class ClassroomService {
  constructor(private readonly db: PostgresDatabase) {}

  /**
   * Creates a new classroom owned by a teacher.
   */
  async create(teacherId: string, name: string): Promise<Classroom> {
    const classroomId = randomUUID();
    const rows = await this.db.query<ClassroomRow>(
      `
      INSERT INTO classrooms (id, teacher_id, name)
      VALUES ($1, $2, $3)
      RETURNING id, teacher_id, name, created_at
    `,
      [classroomId, teacherId, name.trim()]
    );
    const created = rows[0];
    if (!created) {
      throw new Error("Failed to create classroom");
    }
    return mapClassroom(created);
  }

  /**
   * Lists classrooms available to the requesting user.
   */
  async listForUser(user: AuthUser): Promise<Classroom[]> {
    const rows = await this.db.query<ClassroomRow>(
      user.role === "teacher"
        ? `
        SELECT id, teacher_id, name, created_at
        FROM classrooms
        WHERE teacher_id = $1
        ORDER BY created_at DESC
      `
        : `
        SELECT c.id, c.teacher_id, c.name, c.created_at
        FROM classrooms c
        INNER JOIN classroom_memberships m ON m.classroom_id = c.id
        WHERE m.user_id = $1
        ORDER BY c.created_at DESC
      `,
      [user.id]
    );
    return rows.map(mapClassroom);
  }

  /**
   * Looks up a classroom by id if visible to the user.
   */
  async getByIdForUser(user: AuthUser, classroomId: string): Promise<Classroom | null> {
    const rows = await this.db.query<ClassroomRow>(
      user.role === "teacher"
        ? `
        SELECT id, teacher_id, name, created_at
        FROM classrooms
        WHERE id = $1 AND teacher_id = $2
      `
        : `
        SELECT c.id, c.teacher_id, c.name, c.created_at
        FROM classrooms c
        INNER JOIN classroom_memberships m ON m.classroom_id = c.id
        WHERE c.id = $1 AND m.user_id = $2
      `,
      user.role === "teacher" ? [classroomId, user.id] : [classroomId, user.id]
    );
    return rows[0] ? mapClassroom(rows[0]) : null;
  }

  /**
   * Checks whether a user can access a classroom.
   */
  async isUserInClassroom(user: AuthUser, classroomId: string): Promise<boolean> {
    const rows = await this.db.query<MembershipCheckRow>(
      user.role === "teacher"
        ? `
        SELECT 1 AS allowed
        FROM classrooms
        WHERE id = $1 AND teacher_id = $2
      `
        : `
        SELECT 1 AS allowed
        FROM classroom_memberships
        WHERE classroom_id = $1 AND user_id = $2
      `,
      [classroomId, user.id]
    );
    return Boolean(rows[0]);
  }

  /**
   * Enrolls a student in a teacher-owned classroom.
   */
  async addStudentMembership(
    teacherId: string,
    classroomId: string,
    studentEmail: string
  ): Promise<ClassroomMembership> {
    const classroomRows = await this.db.query<ClassroomOwnershipRow>(
      `
      SELECT id
      FROM classrooms
      WHERE id = $1 AND teacher_id = $2
    `,
      [classroomId, teacherId]
    );
    if (!classroomRows[0]) {
      throw new ClassroomOwnershipError(classroomId);
    }

    const normalizedStudentEmail = normalizeEmail(studentEmail);
    const userRows = await this.db.query<MembershipTargetRow>(
      `
      SELECT id, role
      FROM app_users
      WHERE email = $1
    `,
      [normalizedStudentEmail]
    );
    const targetUser = userRows[0];
    if (!targetUser) {
      throw new StudentNotFoundError(normalizedStudentEmail);
    }
    if (targetUser.role !== "student") {
      throw new InvalidMembershipTargetError(normalizedStudentEmail);
    }

    const rows = await this.db.query<ClassroomMembershipRow>(
      `
      INSERT INTO classroom_memberships (classroom_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (classroom_id, user_id)
      DO UPDATE SET classroom_id = EXCLUDED.classroom_id
      RETURNING classroom_id, user_id, created_at
    `,
      [classroomId, targetUser.id]
    );
    const created = rows[0];
    if (!created) {
      throw new Error("Failed to create classroom membership");
    }
    return mapClassroomMembership(created);
  }
}

interface ClassroomRow {
  id: string;
  teacher_id: string;
  name: string;
  created_at: Date;
}

interface MembershipCheckRow {
  allowed: number;
}

interface ClassroomOwnershipRow {
  id: string;
}

interface MembershipTargetRow {
  id: string;
  role: AuthUser["role"];
}

interface ClassroomMembershipRow {
  classroom_id: string;
  user_id: string;
  created_at: Date;
}

function mapClassroom(row: ClassroomRow): Classroom {
  return {
    id: row.id,
    name: row.name,
    teacherId: row.teacher_id,
    createdAt: row.created_at.toISOString()
  };
}

function mapClassroomMembership(row: ClassroomMembershipRow): ClassroomMembership {
  return {
    classroomId: row.classroom_id,
    userId: row.user_id,
    createdAt: row.created_at.toISOString()
  };
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
