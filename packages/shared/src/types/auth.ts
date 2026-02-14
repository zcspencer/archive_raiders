/**
 * User role used by API authorization checks.
 */
export type UserRole = "student" | "teacher";

/**
 * Authenticated user profile returned by auth endpoints.
 */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

/**
 * Request payload for user registration.
 */
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

/**
 * Request payload for user login.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Response payload for successful authentication.
 */
export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
