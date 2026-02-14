import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
export function createGameConfig(parent) {
    return {
        type: Phaser.AUTO,
        parent,
        width: 1024,
        height: 576,
        backgroundColor: "#111827",
        scene: [BootScene]
    };
}
//# sourceMappingURL=config.js.map