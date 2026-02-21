import { describe, expect, it } from "vitest";
import { movePayloadSchema, tileCoordinateSchema } from "./interaction.schema.js";

describe("interaction schemas", () => {
  it("accepts valid move payload", () => {
    const parsed = movePayloadSchema.parse({ gridX: 8, gridY: 14 });
    expect(parsed.gridX).toBe(8);
    expect(parsed.gridY).toBe(14);
  });

  it("rejects invalid tile coordinate", () => {
    const result = tileCoordinateSchema.safeParse({ gridX: -1, gridY: 2 });
    expect(result.success).toBe(false);
  });
});
