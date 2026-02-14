import type { AuthUser } from "@odyssey/shared";
import { describe, expect, it, vi } from "vitest";
import type { PostgresDatabase } from "../db/postgres.js";
import { AuthService } from "./AuthService.js";

function createDbMock() {
  return {
    query: vi.fn()
  } as unknown as PostgresDatabase;
}

function createStoredUserRow(overrides: Partial<AuthUser> = {}) {
  return {
    id: overrides.id ?? "user-1",
    email: overrides.email ?? "teacher@example.com",
    display_name: overrides.displayName ?? "Teacher",
    role: overrides.role ?? "teacher",
    password_hash: "salt:hash"
  };
}

describe("AuthService", () => {
  it("registers a new user and returns a signed access token", async () => {
    const db = createDbMock();
    const queryMock = vi.mocked(db.query);
    queryMock.mockResolvedValueOnce([]);
    queryMock.mockResolvedValueOnce([]);

    const service = new AuthService(db, "local-test-secret", 3600);
    const response = await service.register({
      email: "Teacher@example.com",
      displayName: "Teacher",
      password: "StrongPassword123!",
      role: "teacher"
    });

    expect(response.user.email).toBe("teacher@example.com");
    expect(response.accessToken.length).toBeGreaterThan(20);
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("rejects duplicate email registration", async () => {
    const db = createDbMock();
    vi.mocked(db.query).mockResolvedValueOnce([createStoredUserRow()]);

    const service = new AuthService(db, "local-test-secret", 3600);

    await expect(
      service.register({
        email: "teacher@example.com",
        displayName: "Teacher",
        password: "StrongPassword123!",
        role: "teacher"
      })
    ).rejects.toThrowError("User already exists");
  });

  it("logs in with valid credentials and resolves user from token", async () => {
    const db = createDbMock();
    const queryMock = vi.mocked(db.query);
    const service = new AuthService(db, "local-test-secret", 3600);

    queryMock.mockResolvedValueOnce([]);
    queryMock.mockResolvedValueOnce([]);
    const created = await service.register({
      email: "student@example.com",
      displayName: "Student",
      password: "StrongPassword123!",
      role: "student"
    });

    const insertedArgs = queryMock.mock.calls[1]?.[1] ?? [];
    const passwordHash = insertedArgs[4];
    if (typeof passwordHash !== "string") {
      throw new Error("Password hash was not captured from registration insert.");
    }

    queryMock.mockResolvedValueOnce([
      createStoredUserRow({
        id: created.user.id,
        email: created.user.email,
        displayName: created.user.displayName,
        role: created.user.role,
      })
    ].map((row) => ({ ...row, password_hash: passwordHash })));

    const loggedIn = await service.login({
      email: "student@example.com",
      password: "StrongPassword123!"
    });
    const authUser = service.getUserFromAccessToken(loggedIn.accessToken);

    expect(loggedIn.user.role).toBe("student");
    expect(authUser?.email).toBe("student@example.com");
  });

  it("rejects invalid credentials", async () => {
    const db = createDbMock();
    const queryMock = vi.mocked(db.query);
    const service = new AuthService(db, "local-test-secret", 3600);

    queryMock.mockResolvedValueOnce([]);
    queryMock.mockResolvedValueOnce([]);
    const created = await service.register({
      email: "student2@example.com",
      displayName: "Student",
      password: "StrongPassword123!",
      role: "student"
    });

    const insertedArgs = queryMock.mock.calls[1]?.[1] ?? [];
    const passwordHash = insertedArgs[4];
    if (typeof passwordHash !== "string") {
      throw new Error("Password hash was not captured from registration insert.");
    }

    queryMock.mockResolvedValueOnce([
      {
        ...createStoredUserRow({
          id: created.user.id,
          email: created.user.email,
          displayName: created.user.displayName,
          role: created.user.role
        }),
        password_hash: passwordHash
      }
    ]);

    await expect(
      service.login({
        email: "student2@example.com",
        password: "WrongPassword!"
      })
    ).rejects.toThrowError("Invalid credentials");
  });
});
