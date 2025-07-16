import { Controller } from "@flamework/core";
import { Players, Teams } from "@rbxts/services";
import { Trash } from "@rbxts/trash";
import { atom, subscribe } from "@rbxts/charm";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { assets, TRIBE_COLORS } from "shared/constants";
import { mainScreen, player } from "client/constants";

import type { CharacterController } from "../character";
import type { TribesController } from "../replication/tribes";

const GRAYED_BUTTON_COLOR = new Color3(0.3, 0.3, 0.3);

@Controller()
export class TribesUIController {
  public readonly toggled = new Signal<(on: boolean) => void>;

  private readonly frame = mainScreen.Tribes;
  private readonly visibleTrash = new Trash;

  public constructor(
    character: CharacterController,
    private readonly tribes: TribesController

  ) {
    messaging.client.on(Message.TribeCreated, chief => {
      // TODO: notify of tribe creation

      if (chief !== player) return;
      this.update(chief);
    });

    subscribe(tribes.tribeTeam, () => this.update());

    const { visibleTrash, frame } = this;
    const visibilityUpdate = () => {
      visibleTrash.purge();
      this.update();
    }

    frame.GetPropertyChangedSignal("Visible").Connect(() => {
      if (frame.Visible) return;
      visibilityUpdate();
    });
    frame.Tribe.GetPropertyChangedSignal("Visible").Connect(() => {
      if (frame.Tribe.Visible) return;
      visibilityUpdate();
    });
    frame.NoTribe.GetPropertyChangedSignal("Visible").Connect(() => {
      if (frame.NoTribe.Visible) return;
      visibilityUpdate();
    });

    this.update();
    character.died.Connect(() => this.update());
  }

  private update(chief?: Player): void {
    const tribeTeam = this.tribes.tribeTeam();
    if (tribeTeam === Teams.NoTribe)
      this.handleNoTribe();
    else
      this.handleTribe(tribeTeam, chief);
  }

  private async handleTribe(tribeTeam: Team, chief = this.tribes.getChief().await()[1] as Player): Promise<void> {
    if (!chief) return;
    this.frame.NoTribe.Visible = false;

    const { visibleTrash } = this;
    const isChief = player === chief;
    const tribe = this.frame.Tribe;
    tribe.Visible = true;
    tribe.TribeName.TextColor3 = tribeTeam.TeamColor.Color;
    tribe.TribeName.Text = tribeTeam.Name + " Tribe";
    tribe.ChiefName.Text = ("CHIEF " + chief.Name).upper();

    const is4K = mainScreen.AbsoluteSize.X >= 3840 - 1;
    const size = Enum.ThumbnailSize[is4K ? "Size352x352" : "Size150x150"];
    const [image, success] = Players.GetUserThumbnailAsync(chief.UserId, Enum.ThumbnailType.AvatarBust, size);
    if (success)
      tribe.ChiefAvatar.Image = image;

    const { tribes } = this;
    const membersTrash = visibleTrash.add(new Trash);
    const updateMembers = (members: Player[]) => {
      membersTrash.purge();
      for (const member of members) {
        const memberFrame = visibleTrash.add(assets.UI.TribeMember.Clone());
        memberFrame.PlayerName.Text = member.Name;
        memberFrame.Parent = tribe.Members;

        if (!isChief) continue;
        memberFrame.Kick.MouseButton1Click.Once(async () =>
          messaging.server.emit(Message.KickTribeMember, member)
        );
      }
    }

    updateMembers(tribes.tribeMembers());
    visibleTrash.add(subscribe(tribes.tribeMembers, updateMembers));

    const roleFrame = tribe[isChief ? "Chief" : "Member"];
    roleFrame.Visible = true;

    if (isChief) {
      const chiefFrame = roleFrame as typeof tribe.Chief;
      visibleTrash.add(chiefFrame.Ally.MouseButton1Click.Connect(() => {

      }));
      visibleTrash.add(chiefFrame.Announce.MouseButton1Click.Connect(() => {

      }));
      visibleTrash.add(chiefFrame.PlaceTotem.MouseButton1Click.Connect(() => {

      }));
    }

    visibleTrash.add(roleFrame.Leave.MouseButton1Click.Connect(() =>
      messaging.server.emit(Message.LeaveTribe)
    ));
  }

  private handleNoTribe(): void {
    const { visibleTrash } = this;
    this.frame.Tribe.Visible = false;

    const noTribe = this.frame.NoTribe;
    const defaultButtonColor = noTribe.Create.BackgroundColor3;
    noTribe.Visible = true;

    const selectedColor = atom<Maybe<BrickColor>>(undefined);
    noTribe.Create.BackgroundColor3 = GRAYED_BUTTON_COLOR;
    visibleTrash.add(subscribe(selectedColor, color =>
      noTribe.Create.BackgroundColor3 = color !== undefined ? defaultButtonColor : GRAYED_BUTTON_COLOR
    ));

    visibleTrash.add(noTribe.Create.MouseButton1Click.Connect(() => {
      const color = selectedColor();
      if (!color) return;

      messaging.server.emit(Message.CreateTribe, color.Name as never);
      noTribe.Visible = false;
    }));

    for (const color of TRIBE_COLORS) {
      const button = visibleTrash.add(assets.UI.ColorButton.Clone());
      button.Name = color.Name;
      button.BackgroundColor3 = color.Color;
      button.Parent = noTribe.Colors;
      button.MouseButton1Click.Connect(() => selectedColor(color));
    }
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