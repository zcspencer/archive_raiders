/**
 * Error thrown when API request fails.
 */
export declare class ApiError extends Error {
    readonly statusCode: number;
    constructor(message: string, statusCode: number);
}
/**
 * Executes a typed JSON API request with optional bearer auth.
 */
export declare function requestJson<TResponse>(path: string, options?: RequestInit, accessToken?: string): Promise<TResponse>;
//# sourceMappingURL=client.d.ts.map