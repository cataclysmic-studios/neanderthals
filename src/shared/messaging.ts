import { MessageEmitter, BuiltinMiddlewares } from "@rbxts/tether";
import type { List, Packed, u8, u12, u16 } from "@rbxts/serio";
import type { Diff } from "@rbxts/diff";

import type {
  CreatureSpawnPacket,
  CreatureUpdatePacket,
  CreatureDamagePacket,
  DamagePacket,
  ToolEquipReplicationPacket,
  CreatureHealthChangePacket,
  AddHotbarItemPacket,
  PlaceStructurePacket,
  AudioPacket,
  DropInteractPacket,
  AudioStopPacket,
  UpdateStructureInventoryPacket,
  TakeFromStructureInventoryPacket
} from "./structs/packets";
import type { TribeColorName } from "./constants";
import type { PlayerData } from "./structs/player-data";
import type { CraftingRecipe } from "./structs/crafting-recipe";

export const messaging = MessageEmitter.create<MessageData>();
messaging.middleware
  .useServer(Message.CreateTribe, BuiltinMiddlewares.rateLimit(1))
  // .useSharedGlobal(BuiltinMiddlewares.debug())
  .useSharedGlobal(BuiltinMiddlewares.maxPacketSize(768));

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
  InteractWithDrop,
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
  TribeTotemExists,
  PlayAudio,
  ReplicateAudio,
  ReplicateAudioStopGlobal,
  SyncContent,
  ReadyForContent,
  UpdateWeather,
  UpdateStructureInventory,
  TakeFromStructureInventory
}

type UnpackedIDIndex = u16;

export interface MessageData {
  [Message.Damage]: Packed<DamagePacket>;
  [Message.DamageCreature]: Packed<CreatureDamagePacket>;
  [Message.ShowDamageDisplay]: Humanoid;
  [Message.EquipTool]: HotbarKeyName;
  [Message.UnequipTool]: undefined;
  [Message.ReplicateEquipTool]: ToolEquipReplicationPacket;
  [Message.ReplicateUnequipTool]: Player;
  [Message.UpdateHunger]: u8;
  [Message.InitializeData]: undefined;
  [Message.DataUpdated]: Packed<Diff<PlayerData>>;
  [Message.DropItem]: UnpackedIDIndex;
  [Message.InteractWithDrop]: Packed<DropInteractPacket>;
  [Message.SpawnCreature]: Packed<CreatureSpawnPacket>;
  [Message.UpdateCreatures]: CreatureUpdatePacket;
  [Message.CreatureHealthChange]: Packed<CreatureHealthChangePacket>;
  [Message.Consume]: UnpackedIDIndex;
  [Message.AddHotbarItem]: Packed<AddHotbarItemPacket>;
  [Message.RemoveHotbarItem]: HotbarKeyName;
  [Message.Craft]: UnpackedIDIndex;
  [Message.PlaceStructure]: Packed<PlaceStructurePacket>;
  [Message.CreateTribe]: TribeColorName;
  [Message.TribeCreated]: Player;
  [Message.KickTribeMember]: Player;
  [Message.JoinTribe]: Player; // chief
  [Message.LeaveTribe]: undefined;
  [Message.GetTribeChief]: undefined;
  [Message.ReturnTribeChief]: Maybe<Player>;
  [Message.TribeTotemExists]: boolean;
  [Message.PlayAudio]: Packed<AudioPacket>;
  [Message.ReplicateAudio]: Packed<AudioPacket>;
  [Message.ReplicateAudioStopGlobal]: Packed<AudioStopPacket>;
  [Message.SyncContent]: Packed<List<CraftingRecipe, u12>>;
  [Message.ReadyForContent]: undefined;
  [Message.UpdateWeather]: u8;
  [Message.UpdateStructureInventory]: Packed<UpdateStructureInventoryPacket>;
  [Message.TakeFromStructureInventory]: Packed<TakeFromStructureInventoryPacket>;
}