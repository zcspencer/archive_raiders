import type { TaskDefinition } from "@odyssey/shared";
import { describe, expect, it } from "vitest";
import { zoomDiscoverValidator } from "./zoomDiscover";

const definition: TaskDefinition = {
  id: "zoom-ancient-map",
  type: "zoom-discover",
  title: "The Ancient Map",
  description: "Zoom in to uncover the secret.",
  difficulty: 1,
  config: {
    content: "Map content",
    hiddenDetail: "Vault beneath the old well",
    revealAtZoom: 2.5
  },
  hints: [],
  rewards: { currency: 30, xp: 20, items: [] }
};

describe("zoomDiscover validator", () => {
  it("returns full score when discovered value matches hiddenDetail (exact)", () => {
    const result = zoomDiscoverValidator.validate(definition, {
      discoveredValue: "Vault beneath the old well"
    });

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
    expect(result.feedback).toBe("Correct! You found the hidden detail.");
  });

  it("returns full score when match is case-insensitive and trimmed", () => {
    const result = zoomDiscoverValidator.validate(definition, {
      discoveredValue: "  VAULT BENEATH THE OLD WELL  "
    });

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
  });

  it("returns failure when discovered value is wrong", () => {
    const result = zoomDiscoverValidator.validate(definition, {
      discoveredValue: "wrong detail"
    });

    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toContain("not quite right");
  });

  it("returns failure when discoveredValue is missing", () => {
    const result = zoomDiscoverValidator.validate(definition, {});

    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
  });
});
