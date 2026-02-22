import type { TaskDefinition } from "@odyssey/shared";
import { describe, expect, it } from "vitest";
import { validateFindCopyPaste } from "./findCopyPaste";

const definition: TaskDefinition = {
  id: "ancient-computer-password",
  type: "find-copy-paste",
  title: "The Ancient Terminal",
  description: "Find the password in the logs.",
  difficulty: 2,
  config: { password: "qR7x2mPwK9vL4nBz", passwordLabel: "Access Key" },
  hints: [],
  rewards: { currency: 50, xp: 35, items: [] }
};

describe("validateFindCopyPaste", () => {
  it("returns full score for correct password", () => {
    const result = validateFindCopyPaste(definition, {
      password: "qR7x2mPwK9vL4nBz"
    });

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
    expect(result.feedback).toBe("Access granted!");
  });

  it("returns failure for wrong password", () => {
    const result = validateFindCopyPaste(definition, {
      password: "wrong"
    });

    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toContain("Incorrect password");
  });
});
