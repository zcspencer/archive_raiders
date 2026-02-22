import { randomUUID } from "node:crypto";
import type { PostgresDatabase } from "../db/postgres.js";

/**
 * Row shape for task_completions table.
 */
export interface TaskCompletionRow {
  id: string;
  user_id: string;
  classroom_id: string;
  task_id: string;
  attempt_id: string;
  is_correct: boolean;
  score: number;
  started_at_client: string | null;
  started_at_server: string;
  completed_at: string;
  created_at: string;
}

/**
 * Persists and queries task attempt/completion data for analytics and gate-skipping.
 */
export class TaskCompletionService {
  constructor(private readonly db: PostgresDatabase) {}

  /**
   * Records a task attempt. Idempotent on attempt_id: re-submits with the same
   * attempt_id return the existing row without inserting a duplicate.
   */
  async recordAttempt(
    userId: string,
    classroomId: string,
    taskId: string,
    attemptId: string,
    isCorrect: boolean,
    score: number,
    startedAtClient: string | null
  ): Promise<TaskCompletionRow> {
    const existing = await this.db.query<TaskCompletionRow>(
      `SELECT id, user_id, classroom_id, task_id, attempt_id, is_correct, score,
              started_at_client, started_at_server, completed_at, created_at
       FROM task_completions WHERE attempt_id = $1`,
      [attemptId]
    );
    if (existing.length > 0) {
      return existing[0]!;
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    await this.db.query(
      `INSERT INTO task_completions (
        id, user_id, classroom_id, task_id, attempt_id, is_correct, score,
        started_at_client, started_at_server, completed_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $9)`,
      [
        id,
        userId,
        classroomId,
        taskId,
        attemptId,
        isCorrect,
        score,
        startedAtClient ?? null,
        now
      ]
    );

    const rows = await this.db.query<TaskCompletionRow>(
      `SELECT id, user_id, classroom_id, task_id, attempt_id, is_correct, score,
              started_at_client, started_at_server, completed_at, created_at
       FROM task_completions WHERE attempt_id = $1`,
      [attemptId]
    );
    return rows[0]!;
  }

  /**
   * Returns distinct task IDs the user has successfully completed (is_correct = true).
   * Used for the completions endpoint and gate-skipping; scoped per-user globally, not per-classroom.
   */
  async getCompletedTaskIds(userId: string): Promise<string[]> {
    const rows = await this.db.query<{ task_id: string }>(
      `SELECT DISTINCT task_id FROM task_completions
       WHERE user_id = $1 AND is_correct = true
       ORDER BY task_id`,
      [userId]
    );
    return rows.map((r) => r.task_id);
  }

  /**
   * Returns all completion rows for a classroom, optionally filtered by task_id.
   * For teacher dashboard aggregations.
   */
  async getCompletionsForClassroom(
    classroomId: string,
    taskId?: string
  ): Promise<TaskCompletionRow[]> {
    if (taskId) {
      return this.db.query<TaskCompletionRow>(
        `SELECT id, user_id, classroom_id, task_id, attempt_id, is_correct, score,
                started_at_client, started_at_server, completed_at, created_at
         FROM task_completions
         WHERE classroom_id = $1 AND task_id = $2
         ORDER BY completed_at DESC`,
        [classroomId, taskId]
      );
    }
    return this.db.query<TaskCompletionRow>(
      `SELECT id, user_id, classroom_id, task_id, attempt_id, is_correct, score,
              started_at_client, started_at_server, completed_at, created_at
       FROM task_completions
       WHERE classroom_id = $1
       ORDER BY completed_at DESC`,
      [classroomId]
    );
  }
}
