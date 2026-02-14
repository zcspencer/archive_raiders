import { PostgresDatabase } from "../db/postgres.js";

/**
 * Resolves the integration database URL from environment variables.
 */
export function getIntegrationDatabaseUrl(): string | null {
  const value = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  return value && value.length > 0 ? value : null;
}

/**
 * Creates and migrates a database connection for integration tests.
 */
export async function createIntegrationDatabase(): Promise<PostgresDatabase> {
  const databaseUrl = getIntegrationDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("Missing TEST_DATABASE_URL for integration tests");
  }

  const db = new PostgresDatabase(databaseUrl);
  await db.migrate();
  return db;
}

/**
 * Clears data from integration tables between tests.
 */
export async function resetIntegrationTables(db: PostgresDatabase): Promise<void> {
  await db.query(
    "TRUNCATE TABLE classroom_memberships, classrooms, app_users RESTART IDENTITY CASCADE"
  );
}
