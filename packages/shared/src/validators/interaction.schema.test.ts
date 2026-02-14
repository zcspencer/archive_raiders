import { describe, expect, it } from "vitest";
import { interactPayloadSchema, movePayloadSchema } from "./interaction.schema.js";

describe("interaction schemas", () => {
  it("accepts valid move payload", () => {
    const parsed = movePayloadSchema.parse({ gridX: 8, gridY: 14 });
    expect(parsed.gridX).toBe(8);
    expect(parsed.gridY).toBe(14);
  });

  it("rejects invalid interact payload", () => {
    const result = interactPayloadSchema.safeParse({
      target: { gridX: -1, gridY: 2 },
      toolId: "axe",
      actionType: "primary",
      chargeMs: 0
    });
    expect(result.success).toBe(false);
  });
});
