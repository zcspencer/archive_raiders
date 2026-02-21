import { describe, expect, it } from "vitest";
import {
  calculateDamage,
  canAttack,
  isInRange,
  type EquippableDamageParams
} from "./damageService.js";

const axeParams: EquippableDamageParams = {
  baseDamage: 2,
  tagModifiers: { tree: 3.0 },
  rate: 1,
  range: 1
};

describe("calculateDamage", () => {
  it("applies base damage when target has no matching tags", () => {
    expect(calculateDamage(axeParams, [])).toBe(2);
    expect(calculateDamage(axeParams, ["rock"])).toBe(2);
  });

  it("applies tag modifier when target has matching tag", () => {
    expect(calculateDamage(axeParams, ["tree"])).toBe(6);
    expect(calculateDamage(axeParams, ["tree", "wood"])).toBe(6);
  });

  it("uses highest matching modifier when target has multiple tags", () => {
    const params: EquippableDamageParams = {
      ...axeParams,
      tagModifiers: { tree: 2, wood: 3 }
    };
    expect(calculateDamage(params, ["tree", "wood"])).toBe(6);
  });

  it("returns 0 when baseDamage is 0", () => {
    expect(calculateDamage({ ...axeParams, baseDamage: 0 }, ["tree"])).toBe(0);
  });
});

describe("canAttack", () => {
  it("allows attack when enough time has passed", () => {
    expect(canAttack(0, 1, 1100)).toBe(true);
    expect(canAttack(1000, 1, 2001)).toBe(true);
  });

  it("denies attack when within cooldown", () => {
    expect(canAttack(1000, 1, 1500)).toBe(false);
    expect(canAttack(1000, 2, 1499)).toBe(false);
  });

  it("allows faster rate to attack sooner", () => {
    expect(canAttack(1000, 2, 1500)).toBe(true);
  });
});

describe("isInRange", () => {
  it("returns true for adjacent tile (range 1)", () => {
    expect(isInRange(5, 5, 5, 4, 1)).toBe(true);
    expect(isInRange(5, 5, 6, 5, 1)).toBe(true);
    expect(isInRange(5, 5, 5, 5, 1)).toBe(true);
  });

  it("returns false for tile two steps away with range 1", () => {
    expect(isInRange(5, 5, 7, 5, 1)).toBe(false);
    expect(isInRange(5, 5, 5, 7, 1)).toBe(false);
  });

  it("returns true for diagonal within Chebyshev range", () => {
    expect(isInRange(5, 5, 6, 6, 1)).toBe(true);
    expect(isInRange(5, 5, 6, 6, 2)).toBe(true);
  });
});
