import type { TaskDefinition } from "@odyssey/shared";
import { describe, expect, it } from "vitest";
import { copyPasteValidator } from "./copyPaste";

const definition: TaskDefinition = {
  id: "timber-nook-key",
  type: "copy-paste",
  title: "The Key to Timber Nook",
  description: "Copy the magic key rune and paste it into the lock.",
  difficulty: 1,
  config: { sourceContent: "🗝️", expectedValue: "🗝️" },
  hints: [],
  rewards: { currency: 15, xp: 10, items: [] }
};

describe("copyPaste validator", () => {
  it("returns full score when pasted value matches expectedValue", () => {
    const result = copyPasteValidator.validate(definition, {
      pastedValue: "🗝️"
    });

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
    expect(result.feedback).toBe("Key accepted!");
  });

  it("returns failure when pasted value does not match", () => {
    const result = copyPasteValidator.validate(definition, {
      pastedValue: "wrong"
    });

    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toContain("doesn't match");
  });

  it("returns failure when pastedValue is missing", () => {
    const result = copyPasteValidator.validate(definition, {});

    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
  });
});
