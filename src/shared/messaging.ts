import { MessageEmitter } from "@rbxts/tether";
import type { List, Packed, u8 } from "@rbxts/serio";

import type {
  CreatureSpawnPacket,
  CreatureUpdatePacket,
  CreatureDamagePacket,
  DamagePacket,
  ToolEquipReplicationPacket,
  CreatureHealthChangePacket,
  DropItemPacket,
  DropID,
  AddHotbarItemPacket,
  PlaceStructurePacket,
  AudioPacket,
  GameID
} from "./structs/packets";
import type { PlayerData } from "./structs/player-data";
import type { TribeColorName } from "./constants";
import type { CraftingRecipe } from "./structs/crafting-recipe";

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
  Consume,
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
  ReturnTribeChief,
  PlayAudio,
  ReplicateAudio,
  SyncContent,
  ReadyForContent
}

export interface MessageData {
  [Message.Damage]: DamagePacket;
  [Message.DamageCreature]: CreatureDamagePacket;
  [Message.ShowDamageDisplay]: Humanoid;
  [Message.EquipTool]: HotbarKeyName;
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
  [Message.Consume]: GameID;
  [Message.AddHotbarItem]: AddHotbarItemPacket;
  [Message.RemoveHotbarItem]: HotbarKeyName;
  [Message.Craft]: u8;
  [Message.PlaceStructure]: PlaceStructurePacket;
  [Message.CreateTribe]: TribeColorName;
  [Message.TribeCreated]: Player;
  [Message.KickTribeMember]: Player;
  [Message.JoinTribe]: Player; // chief
  [Message.LeaveTribe]: undefined;
  [Message.GetTribeChief]: undefined;
  [Message.ReturnTribeChief]: Maybe<Player>;
  [Message.PlayAudio]: AudioPacket;
  [Message.ReplicateAudio]: AudioPacket;
  [Message.SyncContent]: Packed<List<CraftingRecipe, u8>>;
  [Message.ReadyForContent]: undefined;
}