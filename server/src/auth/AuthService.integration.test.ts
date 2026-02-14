import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import type { PostgresDatabase } from "../db/postgres.js";
import { AuthService } from "./AuthService.js";
import {
  createIntegrationDatabase,
  getIntegrationDatabaseUrl,
  resetIntegrationTables
} from "../test/integration.js";

const runIntegration = getIntegrationDatabaseUrl() ? describe : describe.skip;

runIntegration("AuthService integration", () => {
  let db: PostgresDatabase;
  let service: AuthService;

  beforeAll(async () => {
    db = await createIntegrationDatabase();
    service = new AuthService(db, "integration-test-secret", 3600);
  });

  beforeEach(async () => {
    await resetIntegrationTables(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it("persists registration and allows login with the stored password hash", async () => {
    const registered = await service.register({
      email: "teacher@example.com",
      displayName: "Teacher",
      password: "StrongPassword123!",
      role: "teacher"
    });

    const loggedIn = await service.login({
      email: "teacher@example.com",
      password: "StrongPassword123!"
    });

    expect(registered.user.email).toBe("teacher@example.com");
    expect(loggedIn.user.id).toBe(registered.user.id);
    expect(loggedIn.accessToken.length).toBeGreaterThan(20);
  });

  it("returns a user from a signed access token", async () => {
    const registered = await service.register({
      email: "student@example.com",
      displayName: "Student",
      password: "StrongPassword123!",
      role: "student"
    });

    const fromToken = service.getUserFromAccessToken(registered.accessToken);
    expect(fromToken?.id).toBe(registered.user.id);
    expect(fromToken?.email).toBe("student@example.com");
    expect(fromToken?.role).toBe("student");
  });
});
