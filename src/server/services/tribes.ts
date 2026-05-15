import { Service } from "@flamework/core";
import { Teams, Workspace as World } from "@rbxts/services";
import { Trash } from "@rbxts/trash";

import { Message, messaging } from "shared/messaging";
import { stopHacking } from "server/utility";
import { TRIBE_COLORS, type TribeColorName } from "shared/constants";

import type { BuildingService } from "./building";
import { StructureID } from "shared/structure-id";

const teams = Teams.GetChildren() as Team[];
let cumulativeID = 0;

interface Tribe {
  readonly team: Team;
  readonly trash: Trash;
  readonly chief: Player;
  readonly members: Set<Player>;
  totemID?: number;
}

function hasTotem(tribe: Tribe): tribe is Tribe & { totemID: number; } {
  return "totemID" in tribe;
}

function getPlayers(tribe: Tribe): Player[] {
  return [tribe.chief, ...tribe.members];
}

@Service()
export class TribesService {
  private readonly tribes = new Set<Tribe>;

  public constructor(building: BuildingService) {
    messaging.server.on(Message.CreateTribe, (player, color) => this.create(player, color));
    messaging.server.on(Message.KickTribeMember, (player, member) => this.kickMember(player, member));
    messaging.server.on(Message.JoinTribe, (player, chief) => this.join(player, chief));
    messaging.server.on(Message.LeaveTribe, player => this.leave(player));
    messaging.server.setCallback(Message.GetTribeChief, Message.ReturnTribeChief, player => this.getPlayerTribe(player)?.chief);

    building.structurePlaced.Connect(info => {
      if (info.id !== StructureID.TribeTotem) return;
      this.registerTotem(info.player, info.model);
    });
    building.structureDestroyed.Connect(info => {
      if (info.id !== StructureID.TribeTotem) return;
      this.removeTotem(info.model);
    });
  }

  public getTribeBy<K extends keyof Tribe>(prop: K, value: Tribe[K]): Maybe<Tribe> {
    return [...this.tribes].find(tribe => tribe[prop] === value);
  }

  public getPlayerTribe(player: Player): Maybe<Tribe> {
    return [...this.tribes].find(tribe => tribe.chief === player || tribe.members.has(player));
  }

  private registerTotem(player: Player, totem: Model): void {
    const tribe = this.getPlayerTribe(player);
    if (!tribe)
      return stopHacking(player, "cannot place totem when not in tribe");

    if (hasTotem(tribe))
      return stopHacking(player, "tribe already has totem");

    const totemID = cumulativeID++;
    totem.SetAttribute("TotemID", totemID);
    for (const part of totem.QueryDescendants<BasePart>("BasePart#Color")) {
      part.BrickColor = tribe.team.TeamColor;
    }

    tribe.totemID = totemID;
    messaging.client.emit(getPlayers(tribe), Message.TribeTotemExists, true);
  }

  private removeTotem(totem: Model): void {
    const totemID = totem.GetAttribute<number>("TotemID");
    if (totemID === undefined) return;

    const tribe = this.getTribeBy("totemID", totemID);
    if (!tribe) return;

    delete tribe.totemID;
    messaging.client.emit(getPlayers(tribe), Message.TribeTotemExists, false);
  }

  private join(player: Player, chief: Player): void {
    const tribe = this.getTribeBy("chief", chief);
    if (!tribe) return;

    const { trash, team } = tribe;
    player.Team = team;
    tribe.members.add(player);
    trash.add(() => this.leave(player, tribe));
    this.registerTribePlayer(tribe, player);
  }

  private leave(player: Player, tribe = this.getPlayerTribe(player)): void {
    if (!tribe) return;
    if (tribe.chief === player)
      this.disband(tribe);

    player.Team = Teams.NoTribe;
    tribe.members.delete(player);
    this.updateTribeColors(player, Teams.NoTribe.TeamColor);
  }

  private disband(tribe: Tribe): void {
    tribe.trash.destroy();
    this.tribes.delete(tribe);

    if (tribe.totemID === undefined) return;
    const [totem] = World.PlacedStructures.QueryDescendants<Model>(`Model[$TotemID = ${tribe.totemID}]`);
    if (!totem) return;

    this.removeTotem(totem);
    totem.Destroy();
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

    chief.Team = team;
    trash.add(chief.Destroying.Once(() => this.leave(chief, tribe)));
    this.tribes.add(tribe);
    messaging.client.emitAll(Message.TribeCreated, chief);
    this.registerTribePlayer(tribe, chief);
  }

  private kickMember(requester: Player, member: Player): void {
    const tribe = this.getTribeBy("chief", requester);
    if (!tribe) return;

    tribe.members.delete(member);
  }

  private registerTribePlayer(tribe: Tribe, player: Player): void {
    tribe.trash.add(player.CharacterAdded.Connect(() => this.updateTribeColors(player, tribe.team.TeamColor)));
    messaging.client.emit(player, Message.TribeTotemExists, hasTotem(tribe));
    this.updateTribeColors(player, tribe.team.TeamColor);
  }

  private updateTribeColors(player: Player, color: BrickColor): void {
    const character = player.Character as CharacterModel;
    if (!character) return;

    const bodyColors = character.BodyColors;
    if (!bodyColors) return;

    bodyColors.TorsoColor = color;
    bodyColors.RightLegColor = color;
    bodyColors.LeftLegColor = color;
  }
}