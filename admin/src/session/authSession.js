const AUTH_STORAGE_KEY = "odyssey-admin-auth";
/**
 * Persists admin auth session to localStorage.
 */
export function saveSession(session) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}
/**
 * Loads persisted admin session from localStorage.
 */
export function loadSession() {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw);
    }
    catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
    }
}
/**
 * Clears persisted admin session from localStorage.
 */
export function clearSession() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}
//# sourceMappingURL=authSession.js.map