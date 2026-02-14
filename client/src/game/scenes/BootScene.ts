import Phaser from "phaser";
import type { TiledMapData } from "@odyssey/shared";
import { parseMap } from "../map/TileMapManager";
import villageMapJson from "../../../../content/maps/village.json";

/**
 * Boot scene responsible for loading assets and transitioning to VillageScene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#111827");
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      "Loading village...",
      { color: "#ffffff", fontSize: "18px" }
    ).setOrigin(0.5);

    const mapData = parseMap(villageMapJson as TiledMapData);
    this.registry.set("parsedMap", mapData);
    this.scene.start("VillageScene");
  }
}
