import { describe, expect, it } from "vitest";
import { getValidator } from "./registry";

describe("getValidator", () => {
  it("returns the shortcut validator for shortcut task type", () => {
    const validator = getValidator("shortcut");
    expect(typeof validator).toBe("function");
  });

  it("throws when no validator is registered", () => {
    expect(() => getValidator("unknown-task")).toThrowError(
      "No validator found for task type: unknown-task"
    );
  });
});
