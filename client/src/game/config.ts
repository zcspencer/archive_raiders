import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TiledMapScene } from "./scenes/TiledMapScene";

/**
 * Creates the Phaser game configuration with all registered scenes.
 * Uses Scale.RESIZE so the canvas fills its parent container.
 */
export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: "100%",
      height: "100%"
    },
    backgroundColor: "#111827",
    scene: [BootScene, TiledMapScene]
  };
}
