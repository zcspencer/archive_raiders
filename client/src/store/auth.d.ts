import type { AuthUser, LoginRequest, RegisterRequest } from "@odyssey/shared";
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
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthStoreState>>;
export {};
//# sourceMappingURL=auth.d.ts.map