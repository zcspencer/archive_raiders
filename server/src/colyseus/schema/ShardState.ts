import { MapSchema, Schema, type } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("string") declare id: string;
  @type("uint16") declare gridX: number;
  @type("uint16") declare gridY: number;
}

export class ShardState extends Schema {
  @type({ map: PlayerSchema }) declare players: MapSchema<PlayerSchema>;
  @type("string") declare classroomId: string;

  constructor(classroomId: string) {
    super();
    this.classroomId = classroomId;
    this.players = new MapSchema<PlayerSchema>();
  }
}
