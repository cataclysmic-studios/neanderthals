import { MessageEmitter } from "@rbxts/tether";
import type { u8 } from "@rbxts/serio";

import type {
  CreatureSpawnPacket,
  CreatureUpdatePacket,
  DamagePacket,
  ToolEquipReplicationPacket
} from "./structs/packets";
import type { PlayerData } from "./structs/player-data";

export const messaging = MessageEmitter.create<MessageData>();

export const enum Message {
  Damage,
  ShowDamageDisplay,
  EquipTool,
  UnequipTool,
  ReplicateEquipTool,
  ReplicateUnequipTool,
  UpdateHunger,
  InitializeData,
  DataLoaded,
  DataUpdated,
  PickUpDrop,
  EatDrop,
  SpawnCreature,
  UpdateCreatures
}

export interface MessageData {
  [Message.Damage]: DamagePacket;
  [Message.ShowDamageDisplay]: Humanoid;
  [Message.EquipTool]: ToolItem; // just the slot number when inventory/hotbar is implemented
  [Message.UnequipTool]: undefined;
  [Message.ReplicateEquipTool]: ToolEquipReplicationPacket; // just the slot number when inventory/hotbar is implemented
  [Message.ReplicateUnequipTool]: Player;
  [Message.UpdateHunger]: u8;
  [Message.InitializeData]: undefined;
  [Message.DataUpdated]: PlayerData;
  [Message.PickUpDrop]: u8;
  [Message.EatDrop]: u8;
  [Message.SpawnCreature]: CreatureSpawnPacket;
  [Message.UpdateCreatures]: CreatureUpdatePacket;
}