import { randomUUID } from "node:crypto";
import type { AuthUser, Classroom } from "@odyssey/shared";
import type { PostgresDatabase } from "../db/postgres.js";

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
        SELECT id, teacher_id, name, created_at
        FROM classrooms
        ORDER BY created_at DESC
      `,
      user.role === "teacher" ? [user.id] : []
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
        SELECT id, teacher_id, name, created_at
        FROM classrooms
        WHERE id = $1
      `,
      user.role === "teacher" ? [classroomId, user.id] : [classroomId]
    );
    return rows[0] ? mapClassroom(rows[0]) : null;
  }
}

interface ClassroomRow {
  id: string;
  teacher_id: string;
  name: string;
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
