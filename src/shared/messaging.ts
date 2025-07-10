import { MessageEmitter } from "@rbxts/tether";

import type { DamagePacket } from "./structs/packets";

export const messaging = MessageEmitter.create<MessageData>();

export const enum Message {
  Damage
}

export interface MessageData {
  [Message.Damage]: DamagePacket;
}