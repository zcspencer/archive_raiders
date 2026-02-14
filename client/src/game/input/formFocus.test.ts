import { describe, expect, it } from "vitest";
import { blurFocusedFormField, isFormFieldFocused } from "./formFocus.js";

describe("isFormFieldFocused", () => {
  it("returns true for input elements", () => {
    const input = { tagName: "INPUT" } as unknown as Element;
    expect(isFormFieldFocused(input)).toBe(true);
  });

  it("returns true for contenteditable elements", () => {
    const editable = { tagName: "DIV", contentEditable: "true" } as unknown as Element;
    expect(isFormFieldFocused(editable)).toBe(true);
  });

  it("returns false for non-editable elements", () => {
    const button = { tagName: "BUTTON" } as unknown as Element;
    expect(isFormFieldFocused(button)).toBe(false);
  });

  it("blurs focused form elements", () => {
    let blurred = false;
    const input = {
      tagName: "INPUT",
      blur: () => {
        blurred = true;
      }
    } as unknown as Element;
    const result = blurFocusedFormField(input);
    expect(result).toBe(true);
    expect(blurred).toBe(true);
  });
});
