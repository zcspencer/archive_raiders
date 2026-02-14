import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 1024,
    height: 576,
    backgroundColor: "#111827",
    scene: [BootScene]
  };
}
