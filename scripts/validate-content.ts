import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { taskDefinitionSchema } from "@odyssey/shared";

const CONTENT_DIR = join(process.cwd(), "content");

/**
 * Validates JSON task content definitions.
 */
async function main(): Promise<void> {
  const files = await collectJsonFiles(CONTENT_DIR);
  if (files.length === 0) {
    console.log("No content JSON files found. Skipping validation.");
    return;
  }

  let hasErrors = false;

  for (const filePath of files) {
    try {
      const raw = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      taskDefinitionSchema.parse(parsed);
      console.log(`Validated: ${filePath}`);
    } catch (error: unknown) {
      hasErrors = true;
      console.error(`Validation failed: ${filePath}`);
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }

  if (hasErrors) {
    process.exit(1);
  }
}

/**
 * Recursively collects JSON files under a directory.
 */
async function collectJsonFiles(directoryPath: string): Promise<string[]> {
  try {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(directoryPath, entry.name);
        if (entry.isDirectory()) {
          return collectJsonFiles(fullPath);
        }
        if (entry.isFile() && extname(entry.name) === ".json") {
          return [fullPath];
        }
        return [];
      })
    );
    return nested.flat();
  } catch {
    return [];
  }
}

main().catch((error: unknown) => {
  console.error("Content validation failed unexpectedly.", error);
  process.exit(1);
});
