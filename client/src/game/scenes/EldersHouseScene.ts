import { GridMapScene, type GridMapSceneData } from "./GridMapScene";

/**
 * Interior scene for the Elder's house.
 * A small room with an exit door and a chest.
 */
export class EldersHouseScene extends GridMapScene {
  constructor() {
    super("EldersHouseScene");
  }

  create(data?: GridMapSceneData): void {
    super.create({ ...data, mapKey: data?.mapKey ?? "parsedMap_elders_house" });
  }
}
