import { Players } from "@rbxts/services";

export const player = Players.LocalPlayer;
export const playerGUI = player.WaitForChild("PlayerGui");
export const mainScreen = playerGUI.WaitForChild("Main");