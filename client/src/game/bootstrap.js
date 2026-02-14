import Phaser from "phaser";
import { createGameConfig } from "./config";
let gameInstance = null;
/**
 * Boots Phaser once and keeps a singleton game reference.
 */
export function bootGame() {
    if (!gameInstance) {
        gameInstance = new Phaser.Game(createGameConfig("game-container"));
    }
    return gameInstance;
}
//# sourceMappingURL=bootstrap.js.map