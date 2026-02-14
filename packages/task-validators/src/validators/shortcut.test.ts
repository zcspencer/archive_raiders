import type { TaskDefinition } from "@odyssey/shared";
import { describe, expect, it } from "vitest";
import { validateShortcut } from "./shortcut";

const definition: TaskDefinition = {
  id: "shortcut-ctrl-f",
  type: "shortcut",
  title: "Find command",
  description: "Use the find shortcut.",
  difficulty: 1,
  config: { targetShortcut: "Ctrl+F" },
  hints: [],
  rewards: {
    currency: 10,
    xp: 10,
    items: []
  }
};

describe("validateShortcut", () => {
  it("returns full score for matching shortcut", () => {
    const result = validateShortcut(definition, { pressedKeys: "Ctrl+F" });

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
  });

  it("returns failure feedback for non-matching shortcut", () => {
    const result = validateShortcut(definition, { pressedKeys: "Ctrl+G" });

    expect(result.isCorrect).toBe(false);
    expect(result.feedback).toContain("Expected Ctrl+F");
  });
});
