export function stopHacking(player: Player, reason = "unspecified"): void {
  return player.Kick("nice try dum dum\nreason: " + reason);
}