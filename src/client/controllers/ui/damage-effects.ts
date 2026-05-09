import { Controller, type OnTick } from "@flamework/core";

import { underlayScreen } from "client/constants";

import type { CharacterController } from "../character";

const { clamp } = math;

@Controller()
export class DamageEffectsController implements OnTick {
  private readonly blood = underlayScreen.Blood;

  public constructor(
    private readonly character: CharacterController
  ) { }

  public onTick(): void {
    const humanoid = this.character.getHumanoid();
    if (!humanoid) return;

    const health = humanoid.Health;
    const maxHealth = humanoid.MaxHealth;
    const alpha = clamp(health / maxHealth, 0, 1);
    this.blood.ImageTransparency = alpha;
  }
}