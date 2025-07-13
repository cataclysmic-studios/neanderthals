import { Service } from "@flamework/core";

import { getXPToLevelUp } from "shared/utility";
import type { PlayerData } from "shared/structs/player-data";

import type { DataService } from "./data";

const { abs } = math;

@Service()
export class LevelsService {
  public constructor(
    private readonly data: DataService
  ) {
    data.loaded.Connect(player => this.checkCanLevelUp(player));
  }

  public addXP(player: Player, xp: number): void {
    this.checkCanLevelUp(player, data => data.xp += xp);
  }

  private async checkCanLevelUp(player: Player, before?: (data: DeepWritable<PlayerData>) => void): Promise<void> {
    await this.data.update(player, data => {
      before?.(data);
      this.tryLevelUp(data);
      return true;
    });
  }

  private canLevelUp(level: number, xp: number): LuaTuple<[can: boolean, excessXP?: number]> {
    const xpToLevelUp = getXPToLevelUp(level);
    const neededXP = xpToLevelUp - xp;
    const canLevel = neededXP <= 0;
    return $tuple(canLevel, canLevel ? abs(neededXP) : undefined);
  }

  private tryLevelUp(data: DeepWritable<PlayerData>): void {
    const [canLevelUp, excessXP] = this.canLevelUp(data.level, data.xp);
    if (!canLevelUp) return;
    data.level += 1;
    data.xp = excessXP ?? 0;

    this.tryLevelUp(data);
  }
}