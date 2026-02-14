/**
 * Error shape returned by API helper calls.
 */
export declare class ApiError extends Error {
    readonly statusCode: number;
    constructor(message: string, statusCode: number);
}
/**
 * Executes a typed JSON API request.
 */
export declare function requestJson<TResponse>(path: string, options?: RequestInit): Promise<TResponse>;
//# sourceMappingURL=client.d.ts.map