import { Controller, OnStart } from "@flamework/core";
import { Teams } from "@rbxts/services";
import { atom } from "@rbxts/charm";

import { Message, messaging } from "shared/messaging";
import { player } from "client/constants";

@Controller()
export class TribesController implements OnStart {
  public readonly tribeTeam = atom<Team>(Teams.NoTribe);
  public readonly tribeMembers = atom<Player[]>([]);
  public readonly totemExists = atom(false);

  public constructor() {
    player.GetPropertyChangedSignal("Team").Connect(() => this.tribeTeam(player.Team!));
  }

  public onStart(): void {
    messaging.client.on(Message.TribeTotemExists, exists => this.totemExists(exists));
  }

  public async getChief(): Promise<Maybe<Player>> {
    return await messaging.server.invoke(Message.GetTribeChief, Message.ReturnTribeChief);
  }
}