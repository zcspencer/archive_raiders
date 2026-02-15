import { GridMapScene, type GridMapSceneData } from "./GridMapScene";

/**
 * Generic interior scene for Timber Nook.
 */
export class TimberNookScene extends GridMapScene {
  constructor() {
    super("TimberNookScene");
  }

  create(data?: GridMapSceneData): void {
    super.create({ ...data, mapKey: data?.mapKey ?? "parsedMap_timber_nook" });
  }
}
