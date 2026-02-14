import { authResponseSchema, loginRequestSchema, registerRequestSchema } from "@odyssey/shared";
import { requestJson } from "./client";
/**
 * Calls register endpoint and validates response.
 */
export async function registerUser(payload) {
    const body = registerRequestSchema.parse(payload);
    const response = await requestJson("/auth/register", {
        method: "POST",
        body: JSON.stringify(body)
    });
    return authResponseSchema.parse(response);
}
/**
 * Calls login endpoint and validates response.
 */
export async function loginUser(payload) {
    const body = loginRequestSchema.parse(payload);
    const response = await requestJson("/auth/login", {
        method: "POST",
        body: JSON.stringify(body)
    });
    return authResponseSchema.parse(response);
}
//# sourceMappingURL=auth.js.map