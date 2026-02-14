import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from "node:crypto";
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest
} from "@odyssey/shared";
import type { PostgresDatabase } from "../db/postgres.js";
import { issueAccessToken, verifyAccessToken } from "./jwt.js";

interface StoredUser extends AuthUser {
  passwordHash: string;
}

/**
 * Manages persisted user authentication in PostgreSQL.
 */
export class AuthService {
  constructor(
    private readonly db: PostgresDatabase,
    private readonly jwtSecret: string,
    private readonly tokenTtlSeconds: number
  ) {}

  /**
   * Registers a new user account.
   */
  async register(input: RegisterRequest): Promise<AuthResponse> {
    const normalizedEmail = normalizeEmail(input.email);
    const existingUsers = await this.db.query<StoredUserRow>(
      `
      SELECT id, email, display_name, role, password_hash
      FROM app_users
      WHERE email = $1
    `,
      [normalizedEmail]
    );
    if (existingUsers.length > 0) {
      throw new Error("User already exists");
    }

    const user: StoredUser = {
      id: randomUUID(),
      email: normalizedEmail,
      displayName: input.displayName.trim(),
      role: input.role,
      passwordHash: hashPassword(input.password)
    };

    await this.db.query(
      `
      INSERT INTO app_users (id, email, display_name, role, password_hash)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [user.id, user.email, user.displayName, user.role, user.passwordHash]
    );

    return this.buildAuthResponse(user);
  }

  /**
   * Logs in an existing user account.
   */
  async login(input: LoginRequest): Promise<AuthResponse> {
    const normalizedEmail = normalizeEmail(input.email);
    const rows = await this.db.query<StoredUserRow>(
      `
      SELECT id, email, display_name, role, password_hash
      FROM app_users
      WHERE email = $1
    `,
      [normalizedEmail]
    );
    const user = rows[0] ? mapStoredUser(rows[0]) : null;
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new Error("Invalid credentials");
    }
    return this.buildAuthResponse(user);
  }

  /**
   * Resolves the authenticated user from a bearer token.
   */
  getUserFromAccessToken(token: string): AuthUser | null {
    const claims = verifyAccessToken(token, this.jwtSecret);
    if (!claims) {
      return null;
    }
    return {
      id: claims.sub,
      email: claims.email,
      displayName: claims.displayName,
      role: claims.role
    };
  }

  private buildAuthResponse(user: StoredUser): AuthResponse {
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role
    };
    return {
      accessToken: issueAccessToken(authUser, this.jwtSecret, this.tokenTtlSeconds),
      user: authUser
    };
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password: string, encodedHash: string): boolean {
  const parts = encodedHash.split(":");
  if (parts.length !== 2) {
    return false;
  }
  const [saltHex, hashHex] = parts as [string, string];
  const salt = Buffer.from(saltHex, "hex");
  const expectedHash = Buffer.from(hashHex, "hex");
  const actualHash = scryptSync(password, salt, expectedHash.length);
  return timingSafeEqual(actualHash, expectedHash);
}

interface StoredUserRow {
  id: string;
  email: string;
  display_name: string;
  role: AuthUser["role"];
  password_hash: string;
}

function mapStoredUser(row: StoredUserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    passwordHash: row.password_hash
  };
}
