import { describe, expect, it } from "vitest";
import { taskDefinitionSchema } from "./task.schema";

describe("taskDefinitionSchema", () => {
  it("accepts a valid task definition", () => {
    const parsed = taskDefinitionSchema.parse({
      id: "shortcut-ctrl-f",
      type: "shortcut",
      title: "Find command",
      description: "Use the find shortcut.",
      difficulty: 2,
      config: { targetShortcut: "Ctrl+F" },
      hints: ["Try control key combos."],
      rewards: {
        currency: 10,
        xp: 20,
        items: [{ itemId: "hint-token", quantity: 1 }]
      }
    });

    expect(parsed.id).toBe("shortcut-ctrl-f");
    expect(parsed.rewards.xp).toBe(20);
  });

  it("rejects difficulty outside expected range", () => {
    expect(() =>
      taskDefinitionSchema.parse({
        id: "bad",
        type: "shortcut",
        title: "Bad",
        description: "Bad",
        difficulty: 9,
        config: {},
        hints: [],
        rewards: {
          currency: 0,
          xp: 0,
          items: []
        }
      })
    ).toThrow();
  });
});
