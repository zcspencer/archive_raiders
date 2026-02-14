interface InputAxis {
  x: number;
  y: number;
}

/**
 * Converts directional booleans into a normalized movement vector.
 */
export function getMovementVector(
  isLeftDown: boolean,
  isRightDown: boolean,
  isUpDown: boolean,
  isDownDown: boolean
): InputAxis {
  const x = Number(isRightDown) - Number(isLeftDown);
  const y = Number(isDownDown) - Number(isUpDown);
  if (x === 0 && y === 0) {
    return { x: 0, y: 0 };
  }
  const magnitude = Math.hypot(x, y);
  return { x: x / magnitude, y: y / magnitude };
}

/**
 * Returns fallback interaction tile one step ahead in facing direction.
 */
export function getFacingInteractionTile(
  originGridX: number,
  originGridY: number,
  facingX: number,
  facingY: number
): InputAxis {
  return {
    x: originGridX + facingX,
    y: originGridY + facingY
  };
}
