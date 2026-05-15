import { Controller } from "@flamework/core";
import { Players, Teams } from "@rbxts/services";
import { Trash } from "@rbxts/trash";
import { subscribe } from "@rbxts/charm";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { assets, TRIBE_COLORS } from "shared/constants";
import { mainScreen, player } from "client/constants";

import type { CharacterController } from "../character";
import type { InputController } from "../input";
import type { TribesController } from "../replication/tribes";
import type { BuildingController } from "../building";

const GRAYED_BUTTON_COLOR = new Color3(0.3, 0.3, 0.3);

@Controller()
export class TribesUIController {
  public readonly toggled = new Signal<(on: boolean) => void>;

  private readonly frame = mainScreen.Tribes;
  private readonly tribeFrame = this.frame.Tribe;
  private readonly noTribeFrame = this.frame.NoTribe;
  private readonly defaultButtonColor = this.noTribeFrame.Create.BackgroundColor3;
  private readonly visibleTrash = new Trash;

  public constructor(
    character: CharacterController,
    input: InputController,
    private readonly tribes: TribesController,
    private readonly building: BuildingController
  ) {
    const { visibleTrash, frame, tribeFrame, noTribeFrame } = this;
    input.onKeyDown(Enum.KeyCode.T, () => this.toggle());
    subscribe(tribes.tribeTeam, () => this.update());
    subscribe(tribes.totemExists, exists =>
      tribeFrame.Chief.PlaceTotem.BackgroundColor3 = exists ? GRAYED_BUTTON_COLOR : this.defaultButtonColor
    );
    messaging.client.on(Message.TribeCreated, chief => {
      // TODO: notify of tribe creation

      if (chief !== player) return;
      this.update(chief);
    });

    const visibilityUpdate = () => {
      visibleTrash.purge();
      this.update();
    };

    frame.GetPropertyChangedSignal("Visible").Connect(() => {
      if (frame.Visible) return;
      visibilityUpdate();
    });
    tribeFrame.GetPropertyChangedSignal("Visible").Connect(() => {
      if (tribeFrame.Visible) return;
      visibilityUpdate();
    });
    noTribeFrame.GetPropertyChangedSignal("Visible").Connect(() => {
      if (noTribeFrame.Visible) return;
      visibilityUpdate();
    });

    this.update();
    // character.died.Connect(() => this.update());
  }

  private update(chief?: Player): void {
    const tribeTeam = this.tribes.tribeTeam();
    if (tribeTeam === Teams.NoTribe) {
      this.renderNoTribe();
    } else {
      this.renderTribe(tribeTeam, chief);
    }
  }

  private async renderTribe(tribeTeam: Team, chief?: Player): Promise<void> {
    const { tribes, visibleTrash, tribeFrame } = this;
    chief ??= await tribes.getChief();
    if (!chief) return;
    this.noTribeFrame.Visible = false;

    const isChief = player === chief;
    tribeFrame.Visible = true;
    tribeFrame.TribeName.TextColor3 = tribeTeam.TeamColor.Color;
    tribeFrame.TribeName.Text = tribeTeam.Name + " Tribe";
    tribeFrame.ChiefName.Text = ("CHIEF " + chief.Name).upper();

    const is4K = mainScreen.AbsoluteSize.X >= 3840 - 1;
    const size = Enum.ThumbnailSize[is4K ? "Size352x352" : "Size150x150"];
    const [image, success] = Players.GetUserThumbnailAsync(chief.UserId, Enum.ThumbnailType.AvatarBust, size);
    if (success) {
      tribeFrame.ChiefAvatar.Image = image;
    }

    const membersTrash = visibleTrash.add(new Trash);
    const updateMembers = (members: Player[]) => {
      membersTrash.purge();
      for (const member of members) {
        const memberFrame = membersTrash.add(assets.UI.TribeMember.Clone());
        memberFrame.PlayerName.Text = member.Name;
        memberFrame.Parent = tribeFrame.Members;

        if (!isChief) continue;
        memberFrame.Kick.MouseButton1Click.Once(() =>
          messaging.server.emit(Message.KickTribeMember, member)
        );
      }
    };

    updateMembers(tribes.tribeMembers());
    visibleTrash.add(subscribe(tribes.tribeMembers, updateMembers));

    const roleFrame = tribeFrame[isChief ? "Chief" : "Member"];
    roleFrame.Visible = true;

    if (isChief) {
      const chiefFrame = roleFrame as typeof tribeFrame.Chief;
      visibleTrash.add(chiefFrame.Ally.MouseButton1Click.Connect(() => {

      }));
      visibleTrash.add(chiefFrame.Announce.MouseButton1Click.Connect(() => {

      }));
      visibleTrash.add(chiefFrame.PlaceTotem.MouseButton1Click.Connect(() => {
        if (tribes.totemExists()) return;
        this.frame.Visible = false;
        this.building.enterBuildMode(assets.Structures.TribeTotem);
      }));
    }

    visibleTrash.add(roleFrame.Leave.MouseButton1Click.Connect(() =>
      messaging.server.emit(Message.LeaveTribe)
    ));
  }

  private renderNoTribe(): void {
    const { visibleTrash, noTribeFrame } = this;
    this.tribeFrame.Visible = false;

    const createButton = noTribeFrame.Create;
    noTribeFrame.Visible = true;
    createButton.BackgroundColor3 = GRAYED_BUTTON_COLOR;

    let selectedColor: Maybe<BrickColor>;
    for (const color of TRIBE_COLORS) {
      const button = visibleTrash.add(assets.UI.ColorButton.Clone());
      button.Name = color.Name;
      button.BackgroundColor3 = color.Color;
      button.Parent = noTribeFrame.Colors;
      button.MouseButton1Click.Connect(() => {
        selectedColor = color;
        createButton.BackgroundColor3 = color !== undefined ? this.defaultButtonColor : GRAYED_BUTTON_COLOR;
      });
    }

    visibleTrash.add(createButton.MouseButton1Click.Connect(() => {
      if (!selectedColor) return;

      messaging.server.emit(Message.CreateTribe, selectedColor.Name as never);
      noTribeFrame.Visible = false;
    }));
  }

  public toggle(on = !this.frame.Visible): void {
    if (this.frame.Visible === on) return;
    this.frame.Visible = on;
    this.toggled.Fire(on);
  }

  public isEnabled(): boolean {
    return this.frame.Visible;
  }
}