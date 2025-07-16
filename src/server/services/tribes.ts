import { Service } from "@flamework/core";
import { Teams } from "@rbxts/services";
import { Trash } from "@rbxts/trash";

import { Message, messaging } from "shared/messaging";
import { TRIBE_COLORS, TribeColorName } from "shared/constants";
import { stopHacking } from "server/utility";

const teams = Teams.GetChildren() as Team[];

interface Tribe {
  readonly team: Team;
  readonly trash: Trash;
  readonly chief: Player;
  readonly members: Set<Player>;
}

@Service()
export class TribesService {
  private readonly tribes = new Set<Tribe>;

  public constructor() {
    messaging.server.on(Message.CreateTribe, (player, color) => this.create(player, color));
    messaging.server.on(Message.KickTribeMember, (player, member) => this.kickMember(player, member));
    messaging.server.on(Message.JoinTribe, (player, chief) => this.join(player, chief));
    messaging.server.on(Message.LeaveTribe, player => this.leave(player));
    messaging.server.setCallback(Message.GetTribeChief, Message.ReturnTribeChief, player => this.getPlayerTribe(player)?.chief);
  }

  public getTribeByChief(player: Player): Maybe<Tribe> {
    return [...this.tribes].find(tribe => tribe.chief === player);
  }

  public getPlayerTribe(player: Player): Maybe<Tribe> {
    return [...this.tribes].find(tribe => tribe.chief === player || tribe.members.has(player));
  }

  private join(player: Player, chief: Player): void {
    const tribe = this.getTribeByChief(chief);
    if (!tribe) return;

    player.Team = tribe.team;
    tribe.members.add(player);
    tribe.trash.add(() => this.leave(player, tribe));
  }

  private leave(player: Player, tribe = this.getPlayerTribe(player)): void {
    if (!tribe) return;
    if (tribe.chief === player)
      this.disband(tribe);

    player.Team = Teams.NoTribe;
    tribe.members.delete(player);
  }

  private disband(tribe: Tribe): void {
    tribe.trash.destroy();
    this.tribes.delete(tribe);
  }

  private create(chief: Player, colorName: TribeColorName): void {
    const color = new BrickColor(colorName);
    if (!TRIBE_COLORS.includes(color as never))
      return stopHacking(chief, "unknown tribe color");

    const team = teams.find(team => team.TeamColor === color);
    if (!team)
      return warn("Failed to create tribe: team not found");

    const trash = new Trash;
    const tribe: Tribe = {
      team,
      trash,
      chief,
      members: new Set
    };

    print("Chief", chief, "has founded the", team, "tribe");
    chief.Team = team;
    trash.add(chief.Destroying.Once(() => this.leave(chief, tribe)));
    this.tribes.add(tribe);
    messaging.client.emitAll(Message.TribeCreated, chief);
  }

  private kickMember(requester: Player, member: Player): void {
    const tribe = this.getTribeByChief(requester);
    if (!tribe) return;

    tribe.members.delete(member);
  }
}