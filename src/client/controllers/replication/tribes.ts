import { Controller } from "@flamework/core";
import { Teams } from "@rbxts/services";
import { atom } from "@rbxts/charm";

import { Message, messaging } from "shared/messaging";
import { player } from "client/constants";

@Controller()
export class TribesController {
  public readonly tribeTeam = atom<Team>(Teams.NoTribe);
  public readonly tribeMembers = atom<Player[]>([]);

  public constructor() {
    player.GetPropertyChangedSignal("Team").Connect(() => this.tribeTeam(player.Team!));
  }

  public async getChief(): Promise<Maybe<Player>> {
    return await messaging.server.invoke(Message.GetTribeChief, Message.ReturnTribeChief);
  }
}