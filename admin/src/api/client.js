/**
 * Error thrown when API request fails.
 */
export class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
/**
 * Executes a typed JSON API request with optional bearer auth.
 */
export async function requestJson(path, options = {}, accessToken) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "content-type": "application/json",
            ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
            ...(options.headers ?? {})
        }
    });
    const body = (await response.json());
    if (!response.ok) {
        throw new ApiError(body.error ?? "Request failed", response.status);
    }
    return body;
}
//# sourceMappingURL=client.js.map