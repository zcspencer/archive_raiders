import Phaser from "phaser";
import type { TiledMapData, BootConfig } from "@odyssey/shared";
import { parseTiledMap } from "../map/TiledMapParser";
import bootConfig from "../../../../content/boot.json";

const mapModules = import.meta.glob("../../../../content/maps/*.json", {
  eager: true,
  import: "default"
}) as Record<string, TiledMapData>;

/**
 * Module-level overrides for map data, set by the dev content reload flow.
 * When present, these take priority over the build-time glob imports.
 */
let mapDataOverrides: Record<string, TiledMapData> | null = null;

/**
 * Replaces build-time map data with fresh data fetched from the server.
 * Pass null to clear overrides and revert to bundled data.
 */
export function setMapDataOverrides(
  data: Record<string, TiledMapData> | null
): void {
  mapDataOverrides = data;
}

/** Resolve a map filename (e.g. "village.json") to its loaded JSON data. */
function resolveMapModule(file: string): TiledMapData {
  if (mapDataOverrides?.[file]) return mapDataOverrides[file];
  const match = Object.entries(mapModules).find(([path]) =>
    path.endsWith(`/${file}`)
  );
  if (!match) {
    throw new Error(`Map file not found in glob: ${file}`);
  }
  return match[1];
}

const config = bootConfig as BootConfig;

/**
 * Boot scene responsible for loading assets and transitioning to the game.
 * Configuration is data-driven via content/boot.json.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    for (const sheet of config.spritesheets) {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight
      });
    }
  }

  create(): void {
    const { loadingScreen, initialScene } = config;

    this.cameras.main.setBackgroundColor(loadingScreen.backgroundColor);
    this.add
      .text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        loadingScreen.text,
        loadingScreen.textStyle
      )
      .setOrigin(0.5);

    for (const mapEntry of config.maps) {
      const mapJson = resolveMapModule(mapEntry.file);
      this.registry.set(mapEntry.registryKey, parseTiledMap(mapJson));
    }

    this.scene.start(initialScene.sceneKey, {
      mapKey: initialScene.mapKey,
      spawnName: initialScene.spawnName
    });
  }
}
