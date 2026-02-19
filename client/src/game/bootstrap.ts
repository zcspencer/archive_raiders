import Phaser from "phaser";
import { createGameConfig } from "./config";

let gameInstance: Phaser.Game | null = null;

/**
 * Boots Phaser once and keeps a singleton game reference.
 */
export function bootGame(): Phaser.Game {
  if (!gameInstance) {
    gameInstance = new Phaser.Game(createGameConfig("game-container"));
  }
  return gameInstance;
}

/**
 * Returns the current Phaser game instance, or null if not booted.
 */
export function getGame(): Phaser.Game | null {
  return gameInstance;
}

/**
 * Destroys the Phaser game instance so it can be re-created later.
 */
export function destroyGame(): void {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
}
