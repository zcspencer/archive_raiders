import { type AuthResponse, type LoginRequest, type RegisterRequest } from "@odyssey/shared";
/**
 * Calls register endpoint and validates response.
 */
export declare function registerUser(payload: RegisterRequest): Promise<AuthResponse>;
/**
 * Calls login endpoint and validates response.
 */
export declare function loginUser(payload: LoginRequest): Promise<AuthResponse>;
//# sourceMappingURL=auth.d.ts.map