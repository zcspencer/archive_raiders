import { describe, expect, it } from "vitest";
import { getValidator } from "./registry";

describe("getValidator", () => {
  it("returns a validator for shortcut task type", () => {
    const validator = getValidator("shortcut");
    expect(typeof validator).toBe("function");
  });

  it("returns a validator for find-copy-paste task type", () => {
    const validator = getValidator("find-copy-paste");
    expect(typeof validator).toBe("function");
  });

  it("returns a validator for copy-paste task type", () => {
    const validator = getValidator("copy-paste");
    expect(typeof validator).toBe("function");
  });

  it("returns a validator for zoom-discover task type", () => {
    const validator = getValidator("zoom-discover");
    expect(typeof validator).toBe("function");
  });

  it("throws when no validator is registered", () => {
    expect(() => getValidator("unknown-task")).toThrowError(
      "No validator found for task type: unknown-task"
    );
  });
});
