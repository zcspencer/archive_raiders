/**
 * Resolves image/sprite content from Readable items to a URL the browser can load.
 * - Absolute URLs (http/https/data) are returned as-is.
 * - Paths starting with / are returned as-is (root-relative).
 * - Other strings are treated as paths from the app root (e.g. "maps/ancient.png" -> "/maps/ancient.png").
 *   Place image assets in client/public/ so Vite serves them at the root.
 */
export function resolveReadableImageUrl(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  return "/" + trimmed;
}
