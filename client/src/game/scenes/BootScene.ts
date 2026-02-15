import Phaser from "phaser";
import type { TiledMapData } from "@odyssey/shared";
import { parseMap } from "../map/TileMapManager";
import villageMapJson from "../../../../content/maps/village.json";
import eldersHouseMapJson from "../../../../content/maps/elders_house.json";
import mosslightCottageMapJson from "../../../../content/maps/mosslight_cottage.json";
import timberNookMapJson from "../../../../content/maps/timber_nook.json";

/**
 * Boot scene responsible for loading assets and transitioning to VillageScene.
 * Parses all map files once and stores them in the registry.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#111827");
    this.add
      .text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        "Loading village...",
        { color: "#ffffff", fontSize: "18px" }
      )
      .setOrigin(0.5);

    this.registry.set("parsedMap_village", parseMap(villageMapJson as TiledMapData));
    this.registry.set("parsedMap_elders_house", parseMap(eldersHouseMapJson as TiledMapData));
    this.registry.set(
      "parsedMap_mosslight_cottage",
      parseMap(mosslightCottageMapJson as TiledMapData)
    );
    this.registry.set("parsedMap_timber_nook", parseMap(timberNookMapJson as TiledMapData));

    this.scene.start("VillageScene");
  }
}
