import { type AuthResponse } from "@odyssey/shared";
/**
 * Logs in a teacher account.
 */
export declare function loginTeacher(email: string, password: string): Promise<AuthResponse>;
/**
 * Registers a teacher account for local development flows.
 */
export declare function registerTeacher(displayName: string, email: string, password: string): Promise<AuthResponse>;
//# sourceMappingURL=auth.d.ts.map