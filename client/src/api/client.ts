/**
 * Error shape returned by API helper calls.
 */
export class ApiError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Executes a typed JSON API request.
 */
export async function requestJson<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {})
    }
  });
  const body = (await response.json()) as { error?: string } & TResponse;
  if (!response.ok) {
    throw new ApiError(body.error ?? "Request failed", response.status);
  }
  return body as TResponse;
}
