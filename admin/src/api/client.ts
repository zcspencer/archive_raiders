/**
 * Error thrown when API request fails.
 */
export class ApiError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
  }
}

/**
 * Resolves the API base URL.
 *
 * - Explicit `VITE_API_URL` env var wins.
 * - Production builds (served behind Caddy) use the `/api` reverse-proxy path.
 * - Local dev defaults to the Fastify server on port 3000.
 */
function resolveApiBaseUrl(): string {
  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit) return explicit;
  if (import.meta.env.PROD) return "/api";
  return "http://localhost:3000";
}

const API_BASE_URL = resolveApiBaseUrl();

/**
 * Executes a typed JSON API request with optional bearer auth.
 */
export async function requestJson<TResponse>(
  path: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers ?? {})
    }
  });

  const body = (await response.json()) as { error?: string } & TResponse;
  if (!response.ok) {
    throw new ApiError(body.error ?? "Request failed", response.status);
  }
  return body as TResponse;
}
