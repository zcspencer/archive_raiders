import { Pool, type QueryResultRow } from "pg";

/**
 * Thin PostgreSQL wrapper for server services.
 */
export class PostgresDatabase {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  /**
   * Applies minimal schema migrations required by current services.
   */
  async migrate(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS classrooms (
        id UUID PRIMARY KEY,
        teacher_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  /**
   * Runs a query against the connection pool.
   */
  async query<T extends QueryResultRow>(
    text: string,
    values: readonly unknown[] = []
  ): Promise<T[]> {
    const result = await this.pool.query<T>(text, [...values]);
    return result.rows;
  }

  /**
   * Closes all active DB pool connections.
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
