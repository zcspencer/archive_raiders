import { GridMapScene, type GridMapSceneData } from "./GridMapScene";

/**
 * Village overworld scene.
 */
export class VillageScene extends GridMapScene {
  constructor() {
    super("VillageScene");
  }

  create(data?: GridMapSceneData): void {
    super.create({ ...data, mapKey: data?.mapKey ?? "parsedMap_village" });
  }
}
