import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { AuthUser, TaskAnswer, TaskDefinition, TaskResult } from "@odyssey/shared";
import { taskDefinitionSchema } from "@odyssey/shared";
import { getValidator } from "@odyssey/task-validators";
import type { ClassroomService } from "../classroom/ClassroomService.js";
import { resolveContentDirectory } from "../contentPath.js";

/**
 * Error raised when task content cannot be found for an id.
 */
export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Task not found: ${taskId}`);
  }
}

/**
 * Error raised when a user submits for an inaccessible classroom.
 */
export class ClassroomAccessError extends Error {
  constructor(classroomId: string) {
    super(`Classroom access denied: ${classroomId}`);
  }
}

/**
 * Coordinates classroom-scoped task validation requests.
 */
export class TaskService {
  private readonly resolvedContentDir: string;

  constructor(
    private readonly classroomService: ClassroomService,
    contentDir: string
  ) {
    this.resolvedContentDir = resolveContentDirectory(contentDir);
  }

  /**
   * Validates a task answer for a classroom-scoped user.
   */
  async submit(
    user: AuthUser,
    taskId: string,
    classroomId: string,
    answer: TaskAnswer
  ): Promise<TaskResult> {
    const hasAccess = await this.classroomService.isUserInClassroom(user, classroomId);
    if (!hasAccess) {
      throw new ClassroomAccessError(classroomId);
    }

    const definition = await this.getTaskDefinition(taskId);
    const validator = getValidator(definition.type);
    return validator(definition, answer);
  }

  private async getTaskDefinition(taskId: string): Promise<TaskDefinition> {
    const files = await collectJsonFiles(this.resolvedContentDir);
    for (const path of files) {
      const raw = await readFile(path, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      const result = taskDefinitionSchema.safeParse(parsed);
      if (!result.success) {
        continue;
      }
      if (result.data.id === taskId) {
        return result.data;
      }
    }

    throw new TaskNotFoundError(taskId);
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
