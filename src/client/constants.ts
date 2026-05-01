import { Players } from "@rbxts/services";

export const player = Players.LocalPlayer;
export const playerGUI = player.WaitForChild("PlayerGui") as PlayerGui;
export const mainScreen = playerGUI.WaitForChild("Main") as PlayerGui["Main"];