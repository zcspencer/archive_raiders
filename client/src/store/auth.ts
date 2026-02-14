import type { AuthUser, LoginRequest, RegisterRequest } from "@odyssey/shared";
import { create } from "zustand";
import { loginUser, registerUser } from "../api/auth";

const AUTH_STORAGE_KEY = "odyssey-client-auth";

interface StoredAuthState {
  accessToken: string;
  user: AuthUser;
}

interface AuthStoreState {
  accessToken: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  errorMessage: string | null;
  hydrate: () => void;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

/**
 * Zustand store for client auth session state.
 */
export const useAuthStore = create<AuthStoreState>((set) => ({
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
      const parsed = JSON.parse(raw) as StoredAuthState;
      set({ accessToken: parsed.accessToken, user: parsed.user, errorMessage: null });
    } catch {
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
    } catch (error) {
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
    } catch (error) {
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

function persistState(accessToken: string, user: AuthUser): void {
  const payload: StoredAuthState = { accessToken, user };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}
