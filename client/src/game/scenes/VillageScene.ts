import { RemotePlayersController } from "../systems/RemotePlayersController";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { GridMapScene, type GridMapSceneData } from "./GridMapScene";

/**
 * Village overworld scene. Extends GridMapScene with
 * remote-player reconciliation for multiplayer.
 */
export class VillageScene extends GridMapScene {
  private remotePlayers!: RemotePlayersController;

  constructor() {
    super("VillageScene");
  }

  create(data?: GridMapSceneData): void {
    super.create({ ...data, mapKey: data?.mapKey ?? "parsedMap_village" });
    this.remotePlayers = new RemotePlayersController(this);
  }

  update(): void {
    const room = useGameRoomBridgeStore.getState().room;
    this.remotePlayers.reconcile(room);
    super.update();
  }
}
