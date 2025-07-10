import { MessageEmitter } from "@rbxts/tether";

import type { DamagePacket } from "./structs/packets";

export const messaging = MessageEmitter.create<MessageData>();

export const enum Message {
  Damage,
  ShowDamageDisplay
}

export interface MessageData {
  [Message.Damage]: DamagePacket;
  [Message.ShowDamageDisplay]: Humanoid;
}