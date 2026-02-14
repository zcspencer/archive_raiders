import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AuthUser } from "@odyssey/shared";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { ClassroomService } from "../classroom/ClassroomService.js";
import { ClassroomAccessError, TaskNotFoundError, TaskService } from "./TaskService.js";

const user: AuthUser = {
  id: "student-1",
  email: "student@example.com",
  displayName: "Student",
  role: "student"
};

describe("TaskService", () => {
  let contentDir: string;
  let classroomService: ClassroomService;
  let isUserInClassroom: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    contentDir = await mkdtemp(join(tmpdir(), "task-service-test-"));
    await mkdir(join(contentDir, "tasks"), { recursive: true });
    isUserInClassroom = vi.fn().mockResolvedValue(true);
    classroomService = {
      isUserInClassroom
    } as unknown as ClassroomService;
  });

  afterEach(async () => {
    await rm(contentDir, { recursive: true, force: true });
  });

  it("validates a shortcut submission through the registered validator", async () => {
    await writeTask(contentDir, {
      id: "shortcut-ctrl-f",
      type: "shortcut",
      title: "Shortcut Task",
      description: "Use the right shortcut",
      difficulty: 1,
      config: { targetShortcut: "ctrl+f" },
      hints: [],
      rewards: { currency: 0, xp: 0, items: [] }
    });

    const service = new TaskService(classroomService, contentDir);
    const result = await service.submit(user, "shortcut-ctrl-f", "class-1", {
      pressedKeys: "ctrl+f"
    });

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
    expect(isUserInClassroom).toHaveBeenCalledWith(user, "class-1");
  });

  it("throws when classroom access is denied", async () => {
    isUserInClassroom.mockResolvedValueOnce(false);
    const service = new TaskService(classroomService, contentDir);

    await expect(
      service.submit(user, "shortcut-ctrl-f", "class-1", { pressedKeys: "ctrl+f" })
    ).rejects.toBeInstanceOf(ClassroomAccessError);
  });

  it("throws when task definition cannot be found", async () => {
    const service = new TaskService(classroomService, contentDir);

    await expect(
      service.submit(user, "missing-task", "class-1", { pressedKeys: "ctrl+f" })
    ).rejects.toBeInstanceOf(TaskNotFoundError);
  });
});

async function writeTask(contentDir: string, payload: unknown): Promise<void> {
  await writeFile(
    join(contentDir, "tasks", "test.task.json"),
    JSON.stringify(payload, null, 2),
    "utf-8"
  );
}
