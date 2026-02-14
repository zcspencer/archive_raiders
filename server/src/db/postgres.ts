import type { PoolClient } from "pg";
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
   * Runs multiple queries in a transaction. Rolls back on throw.
   */
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
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

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS classroom_memberships (
        classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (classroom_id, user_id)
      );
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS classroom_memberships_user_id_idx
      ON classroom_memberships (user_id);
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS player_currency (
        user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
        coins INT NOT NULL DEFAULT 0 CHECK (coins >= 0),
        museum_points INT NOT NULL DEFAULT 0 CHECK (museum_points >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS player_inventory (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        definition_id TEXT NOT NULL,
        definition_version INT NOT NULL DEFAULT 1,
        quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
        slot_index INT,
        parent_instance_id UUID REFERENCES player_inventory(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS player_inventory_user_idx ON player_inventory(user_id);
    `);
    await this.pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS player_inventory_user_slot_idx
      ON player_inventory(user_id, slot_index) WHERE slot_index IS NOT NULL;
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS player_inventory_parent_idx
      ON player_inventory(parent_instance_id) WHERE parent_instance_id IS NOT NULL;
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS player_equipment (
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        slot TEXT NOT NULL,
        inventory_item_id UUID NOT NULL REFERENCES player_inventory(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, slot)
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS container_claims (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        object_id TEXT NOT NULL,
        nonce TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('open', 'claimed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, object_id)
      );
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS container_claims_user_object_idx
      ON container_claims(user_id, object_id);
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS classroom_invites (
        id UUID PRIMARY KEY,
        classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        accepted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS classroom_invites_token_idx
      ON classroom_invites(token);
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
   * Runs a query using the given client (for use inside transaction).
   */
  static async queryClient<T extends QueryResultRow>(
    client: PoolClient,
    text: string,
    values: readonly unknown[] = []
  ): Promise<T[]> {
    const result = await client.query<T>(text, [...values]);
    return result.rows;
  }

  /**
   * Closes all active DB pool connections.
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
