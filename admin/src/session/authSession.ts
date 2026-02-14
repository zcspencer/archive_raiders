import type { AuthUser } from "@odyssey/shared";

const AUTH_STORAGE_KEY = "odyssey-admin-auth";

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

/**
 * Persists admin auth session to localStorage.
 */
export function saveSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

/**
 * Loads persisted admin session from localStorage.
 */
export function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

/**
 * Clears persisted admin session from localStorage.
 */
export function clearSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
