/** Spritesheet asset to preload during boot. */
export interface BootSpritesheet {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
}

/** Map to parse and register during boot. */
export interface BootMapEntry {
  registryKey: string;
  /** Filename relative to content/maps/ */
  file: string;
}

/** Initial scene transition after boot completes. */
export interface BootInitialScene {
  sceneKey: string;
  mapKey: string;
  spawnName: string;
}

/** Loading screen appearance. */
export interface BootLoadingScreen {
  backgroundColor: string;
  text: string;
  textStyle: {
    color: string;
    fontSize: string;
  };
}

/** Top-level boot configuration loaded from content/boot.json. */
export interface BootConfig {
  spritesheets: BootSpritesheet[];
  maps: BootMapEntry[];
  initialScene: BootInitialScene;
  loadingScreen: BootLoadingScreen;
}
