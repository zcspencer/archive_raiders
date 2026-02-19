import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import {
  taskDefinitionSchema,
  tiledMapSchema,
  containerDefinitionSchema,
  bootConfigSchema
} from "@odyssey/shared";

const CONTENT_DIR = join(process.cwd(), "content");

type Validator = (data: unknown) => void;

/**
 * Routes file paths to validators. Returns null to skip validation.
 */
function validatorForPath(filePath: string): Validator | null {
  if (filePath.includes("/tasks/") && filePath.endsWith(".task.json")) {
    return (d) => taskDefinitionSchema.parse(d);
  }
  if (filePath.includes("/maps/") && filePath.endsWith(".json")) {
    return (d) => tiledMapSchema.parse(d);
  }
  if (filePath.includes("/containers/") && filePath.endsWith(".container.json")) {
    return (d) => containerDefinitionSchema.parse(d);
  }
  if (filePath.endsWith("/boot.json")) {
    return (d) => bootConfigSchema.parse(d);
  }
  return null;
}

/**
 * Validates content JSON files. Maps, tasks, and containers are validated
 * against their schemas; other JSON files are skipped.
 */
async function main(): Promise<void> {
  const files = await collectJsonFiles(CONTENT_DIR);
  if (files.length === 0) {
    console.log("No content JSON files found. Skipping validation.");
    return;
  }

  let hasErrors = false;

  for (const filePath of files) {
    const validate = validatorForPath(filePath);
    if (!validate) continue;

    try {
      const raw = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      validate(parsed);
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
