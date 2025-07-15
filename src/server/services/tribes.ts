import { Service } from "@flamework/core";
import { Teams } from "@rbxts/services";

import { Message, messaging } from "shared/messaging";
import { TRIBE_COLORS, TribeColorName } from "shared/constants";
import { stopHacking } from "server/utility";

const teams = Teams.GetChildren() as Team[];

interface Tribe {
  readonly chief: Player;
  readonly members: Player[];
}

@Service()
export class TribesService {
  private readonly tribes = new Set<Tribe>;

  public constructor() {
    messaging.server.on(Message.CreateTribe, (player, color) => this.create(player, new BrickColor(color)));
  }

  public create(chief: Player, color: BrickColor): void {
    if (!TRIBE_COLORS.includes(color as never))
      return stopHacking(chief, "unknown tribe color");

    const team = teams.find(team => team.TeamColor === color);
    if (!team)
      return warn("Failed to create tribe: team not found");

    print("Chief", chief, "has founded the", team, "tribe");
    this.tribes.add({
      chief,
      members: []
    });
  }

  public disband(tribe: Tribe): void {
    this.tribes.delete(tribe);
  }

  public getTribeByChief(player: Player): Maybe<Tribe> {
    return [...this.tribes].find(tribe => tribe.chief === player);
  }

  public getPlayerTribe(player: Player): Maybe<Tribe> {
    return [...this.tribes].find(tribe => tribe.chief === player || tribe.members.includes(player));
  }
}