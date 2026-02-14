import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Resolves the content directory so it works when the server runs from the
 * monorepo root or from the server package (e.g. `pnpm dev` via Turbo).
 * Tries cwd first, then one level up (repo root when cwd is server/).
 */
export function resolveContentDirectory(contentDir: string): string {
  if (contentDir.startsWith("/")) {
    return contentDir;
  }

  const fromCwd = resolve(process.cwd(), contentDir);
  if (existsSync(fromCwd)) {
    return fromCwd;
  }

  const fromParent = resolve(process.cwd(), "..", contentDir);
  if (existsSync(fromParent)) {
    return fromParent;
  }

  return fromCwd;
}
