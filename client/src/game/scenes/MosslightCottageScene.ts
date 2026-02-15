import { GridMapScene, type GridMapSceneData } from "./GridMapScene";

/**
 * Generic interior scene for Mosslight Cottage.
 */
export class MosslightCottageScene extends GridMapScene {
  constructor() {
    super("MosslightCottageScene");
  }

  create(data?: GridMapSceneData): void {
    super.create({ ...data, mapKey: data?.mapKey ?? "parsedMap_mosslight_cottage" });
  }
}
