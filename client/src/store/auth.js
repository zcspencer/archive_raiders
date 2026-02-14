import { create } from "zustand";
import { loginUser, registerUser } from "../api/auth";
const AUTH_STORAGE_KEY = "odyssey-client-auth";
/**
 * Zustand store for client auth session state.
 */
export const useAuthStore = create((set) => ({
    accessToken: null,
    user: null,
    isLoading: false,
    errorMessage: null,
    hydrate: () => {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) {
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            set({ accessToken: parsed.accessToken, user: parsed.user, errorMessage: null });
        }
        catch {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        }
    },
    login: async (payload) => {
        set({ isLoading: true, errorMessage: null });
        try {
            const response = await loginUser(payload);
            persistState(response.accessToken, response.user);
            set({
                accessToken: response.accessToken,
                user: response.user,
                isLoading: false,
                errorMessage: null
            });
        }
        catch (error) {
            set({
                isLoading: false,
                errorMessage: error instanceof Error ? error.message : "Login failed"
            });
        }
    },
    register: async (payload) => {
        set({ isLoading: true, errorMessage: null });
        try {
            const response = await registerUser(payload);
            persistState(response.accessToken, response.user);
            set({
                accessToken: response.accessToken,
                user: response.user,
                isLoading: false,
                errorMessage: null
            });
        }
        catch (error) {
            set({
                isLoading: false,
                errorMessage: error instanceof Error ? error.message : "Registration failed"
            });
        }
    },
    logout: () => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        set({ accessToken: null, user: null, errorMessage: null });
    }
}));
function persistState(accessToken, user) {
    const payload = { accessToken, user };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}
//# sourceMappingURL=auth.js.map