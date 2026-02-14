import type { AuthUser } from "@odyssey/shared";
export interface AuthSession {
    accessToken: string;
    user: AuthUser;
}
/**
 * Persists admin auth session to localStorage.
 */
export declare function saveSession(session: AuthSession): void;
/**
 * Loads persisted admin session from localStorage.
 */
export declare function loadSession(): AuthSession | null;
/**
 * Clears persisted admin session from localStorage.
 */
export declare function clearSession(): void;
//# sourceMappingURL=authSession.d.ts.map