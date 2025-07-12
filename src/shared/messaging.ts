import { MessageEmitter } from "@rbxts/tether";
import type { u8 } from "@rbxts/serio";

import type {
  CreatureSpawnPacket,
  CreatureUpdatePacket,
  CreatureDamagePacket,
  DamagePacket,
  ToolEquipReplicationPacket,
  CreatureHealthChangePacket,
  DropItemPacket,
  DropID,
  ItemID,
  AddHotbarItemPacket
} from "./structs/packets";
import type { PlayerData } from "./structs/player-data";

export const messaging = MessageEmitter.create<MessageData>();

export const enum Message {
  Damage,
  DamageCreature,
  ShowDamageDisplay,
  EquipTool,
  UnequipTool,
  ReplicateEquipTool,
  ReplicateUnequipTool,
  UpdateHunger,
  InitializeData,
  DataUpdated,
  DropItem,
  PickUpDrop,
  EatDrop,
  SpawnCreature,
  UpdateCreatures,
  CreatureHealthChange,
  Eat,
  AddHotbarItem,
  RemoveHotbarItem
}

export interface MessageData {
  [Message.Damage]: DamagePacket;
  [Message.DamageCreature]: CreatureDamagePacket;
  [Message.ShowDamageDisplay]: Humanoid;
  [Message.EquipTool]: ToolItem; // just the slot number when inventory/hotbar is implemented
  [Message.UnequipTool]: undefined;
  [Message.ReplicateEquipTool]: ToolEquipReplicationPacket; // just the slot number when inventory/hotbar is implemented
  [Message.ReplicateUnequipTool]: Player;
  [Message.UpdateHunger]: u8;
  [Message.InitializeData]: undefined;
  [Message.DataUpdated]: PlayerData;
  [Message.DropItem]: DropItemPacket;
  [Message.PickUpDrop]: DropID;
  [Message.EatDrop]: DropID;
  [Message.SpawnCreature]: CreatureSpawnPacket;
  [Message.CreatureHealthChange]: CreatureHealthChangePacket;
  [Message.UpdateCreatures]: CreatureUpdatePacket;
  [Message.Eat]: ItemID;
  [Message.AddHotbarItem]: AddHotbarItemPacket;
  [Message.RemoveHotbarItem]: u8;
}