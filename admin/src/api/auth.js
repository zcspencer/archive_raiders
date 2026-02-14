import { authResponseSchema, loginRequestSchema, registerRequestSchema } from "@odyssey/shared";
import { requestJson } from "./client";
/**
 * Logs in a teacher account.
 */
export async function loginTeacher(email, password) {
    const payload = loginRequestSchema.parse({ email, password });
    const response = await requestJson("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
    });
    return authResponseSchema.parse(response);
}
/**
 * Registers a teacher account for local development flows.
 */
export async function registerTeacher(displayName, email, password) {
    const payload = registerRequestSchema.parse({
        displayName,
        email,
        password,
        role: "teacher"
    });
    const response = await requestJson("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
    });
    return authResponseSchema.parse(response);
}
//# sourceMappingURL=auth.js.map