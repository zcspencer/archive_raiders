import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { VillageScene } from "./scenes/VillageScene";

/**
 * Creates the Phaser game configuration with all registered scenes.
 */
export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 1024,
    height: 576,
    backgroundColor: "#111827",
    scene: [BootScene, VillageScene]
  };
}
