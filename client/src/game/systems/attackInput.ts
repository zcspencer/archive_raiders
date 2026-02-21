import Phaser from "phaser";
import { TILE_SIZE } from "@odyssey/shared";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { getItemDefinition } from "../../data/itemDefinitions";

export interface AttackInputConfig {
  getGridX: () => number;
  getGridY: () => number;
  isBlocked: () => boolean;
  /** Called when an attack is sent (for playing hand swing animation). */
  onAttackSent?: (targetGridX: number, targetGridY: number) => void;
}

/**
 * Converts screen coordinates to grid coordinates using the main camera.
 */
export function screenToGrid(scene: Phaser.Scene, x: number, y: number): { gridX: number; gridY: number } {
  const camera = scene.cameras.main;
  const worldX = camera.scrollX + x;
  const worldY = camera.scrollY + y;
  const gridX = Math.floor(worldX / TILE_SIZE);
  const gridY = Math.floor(worldY / TILE_SIZE);
  return { gridX, gridY };
}

/**
 * Returns equippable damage params (baseDamage, rate, range) for the current hand item from client-side definitions.
 */
function getHandEquippableParams(): { baseDamage: number; rate: number; range: number } | undefined {
  const room = useGameRoomBridgeStore.getState().room;
  const sessionId = (room as { sessionId?: string })?.sessionId ?? "";
  const player = room?.state?.players?.get(sessionId) as { equippedHandItemId?: string; equippedHandDefId?: string } | undefined;
  const handDefId = player?.equippedHandDefId;
  if (!handDefId || handDefId === "") return undefined;
  const def = getItemDefinition(handDefId);
  const comp = def?.components?.find((c) => c.typeId === "Equippable");
  const params = comp?.params as { baseDamage?: number; rate?: number; range?: number } | undefined;
  if (!params) return undefined;
  const baseDamage = params.baseDamage ?? 0;
  if (baseDamage <= 0) return undefined;
  return {
    baseDamage,
    rate: params.rate ?? 1,
    range: params.range ?? 1
  };
}

/**
 * Chebyshev distance: max(|dx|, |dy|).
 */
function isInRange(px: number, py: number, tx: number, ty: number, range: number): boolean {
  const dx = Math.abs(tx - px);
  const dy = Math.abs(ty - py);
  return Math.max(dx, dy) <= range;
}

/**
 * Handles mouse click-to-attack and hold-to-repeat. Sends AttackTarget when the player has an
 * equippable with baseDamage > 0 and the target tile is in range.
 */
export class AttackInput {
  private repeatTimer: Phaser.Time.TimerEvent | null = null;
  private lastTarget: { gridX: number; gridY: number } | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: AttackInputConfig
  ) {
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handlePointerUp, this);
  }

  destroy(): void {
    this.stopRepeat();
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handlePointerUp, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.leftButtonDown() !== true) return;
    if (this.config.isBlocked()) return;
    const params = getHandEquippableParams();
    if (!params) return;
    const { gridX, gridY } = screenToGrid(this.scene, pointer.x, pointer.y);
    const px = this.config.getGridX();
    const py = this.config.getGridY();
    if (!isInRange(px, py, gridX, gridY, params.range)) return;
    this.sendAttack(gridX, gridY);
    this.config.onAttackSent?.(gridX, gridY);
    this.lastTarget = { gridX, gridY };
    this.startRepeat(params.rate);
  }

  private handlePointerUp(): void {
    this.stopRepeat();
    this.lastTarget = null;
  }

  private sendAttack(gridX: number, gridY: number): void {
    useGameRoomBridgeStore.getState().sendAttack({ gridX, gridY });
  }

  private startRepeat(rate: number): void {
    this.stopRepeat();
    if (rate <= 0) return;
    const intervalMs = 1000 / rate;
    this.repeatTimer = this.scene.time.addEvent({
      delay: intervalMs,
      callback: () => {
        if (!this.lastTarget) return;
        const params = getHandEquippableParams();
        if (!params) {
          this.stopRepeat();
          return;
        }
        const px = this.config.getGridX();
        const py = this.config.getGridY();
        if (!isInRange(px, py, this.lastTarget.gridX, this.lastTarget.gridY, params.range)) {
          this.stopRepeat();
          return;
        }
        this.sendAttack(this.lastTarget.gridX, this.lastTarget.gridY);
        this.config.onAttackSent?.(this.lastTarget.gridX, this.lastTarget.gridY);
      },
      loop: true
    });
  }

  private stopRepeat(): void {
    if (this.repeatTimer) {
      this.repeatTimer.destroy();
      this.repeatTimer = null;
    }
  }
}
