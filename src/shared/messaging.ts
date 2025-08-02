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
  AddHotbarItemPacket,
  PlaceStructurePacket
} from "./structs/packets";
import type { PlayerData } from "./structs/player-data";
import type { TribeColorName } from "./constants";

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
  RemoveHotbarItem,
  Craft,
  PlaceStructure,
  CreateTribe,
  TribeCreated,
  KickTribeMember,
  JoinTribe,
  LeaveTribe,
  GetTribeChief,
  ReturnTribeChief
}

export interface MessageData {
  [Message.Damage]: DamagePacket;
  [Message.DamageCreature]: CreatureDamagePacket;
  [Message.ShowDamageDisplay]: Humanoid;
  [Message.EquipTool]: HotbarKeys[number];
  [Message.UnequipTool]: undefined;
  [Message.ReplicateEquipTool]: ToolEquipReplicationPacket;
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
  [Message.RemoveHotbarItem]: HotbarKey["Name"];
  [Message.Craft]: u8;
  [Message.PlaceStructure]: PlaceStructurePacket;
  [Message.CreateTribe]: TribeColorName;
  [Message.TribeCreated]: Player;
  [Message.KickTribeMember]: Player;
  [Message.JoinTribe]: Player; // chief
  [Message.LeaveTribe]: undefined;
  [Message.GetTribeChief]: undefined;
  [Message.ReturnTribeChief]: Maybe<Player>;
}