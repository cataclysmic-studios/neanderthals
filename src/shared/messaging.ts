import { MessageEmitter } from "@rbxts/tether";

import type { DamagePacket, ToolEquipReplicationPacket } from "./structs/packets";

export const messaging = MessageEmitter.create<MessageData>();

export const enum Message {
  Damage,
  ShowDamageDisplay,
  EquipTool,
  UnequipTool,
  ReplicateEquipTool,
  ReplicateUnequipTool
}

export interface MessageData {
  [Message.Damage]: DamagePacket;
  [Message.ShowDamageDisplay]: Humanoid;
  [Message.EquipTool]: ToolItem; // just the slot number when inventory/hotbar is implemented
  [Message.UnequipTool]: undefined;
  [Message.ReplicateEquipTool]: ToolEquipReplicationPacket; // just the slot number when inventory/hotbar is implemented
  [Message.ReplicateUnequipTool]: Player;
}