export interface EquippableDamageParams {
  baseDamage: number;
  tagModifiers?: Record<string, number>;
  rate: number;
  range: number;
}

/**
 * Computes damage dealt by an equippable against a target with the given tags.
 * Uses baseDamage * highest matching tagModifier (or 1.0 if no tag match).
 */
export function calculateDamage(
  params: EquippableDamageParams,
  targetTags: string[]
): number {
  if (params.baseDamage <= 0) return 0;
  let multiplier = 1;
  if (params.tagModifiers && targetTags.length > 0) {
    for (const tag of targetTags) {
      const mod = params.tagModifiers[tag];
      if (mod !== undefined && mod > multiplier) multiplier = mod;
    }
  }
  const total = params.baseDamage * multiplier;
  return Math.max(0, Math.floor(total));
}

/**
 * Returns true if enough time has passed since lastAttackAtMs to allow an attack at the given rate (attacks per second).
 */
export function canAttack(lastAttackAtMs: number, rate: number, nowMs: number): boolean {
  if (rate <= 0) return false;
  const minIntervalMs = 1000 / rate;
  return nowMs - lastAttackAtMs >= minIntervalMs;
}

/**
 * Returns true if (targetX, targetY) is within range of (playerX, playerY) using Chebyshev distance.
 */
export function isInRange(
  playerX: number,
  playerY: number,
  targetX: number,
  targetY: number,
  range: number
): boolean {
  const dx = Math.abs(targetX - playerX);
  const dy = Math.abs(targetY - playerY);
  return Math.max(dx, dy) <= range;
}
