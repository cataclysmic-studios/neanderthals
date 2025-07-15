import { Service } from "@flamework/core";
import { getDescendantsOfType } from "@rbxts/instance-utility";
import Signal from "@rbxts/lemon-signal";

import type { OnPlayerAdd } from "server/hooks";

@Service()
export class CharacterService implements OnPlayerAdd {
  public readonly added = new Signal<(player: Player, character: Model) => void>

  public onPlayerAdd(player: Player): void {
    player.CharacterAdded.Connect(character => this.onCharacterAdd(player, character));
  }

  private onCharacterAdd(player: Player, character: Model): void {
    this.added.Fire(player, character);
    for (const part of getDescendantsOfType(character, "BasePart"))
      part.CollisionGroup = "Players";
  }
}