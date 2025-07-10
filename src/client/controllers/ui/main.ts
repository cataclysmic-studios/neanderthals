import { Controller } from "@flamework/core";
import { playerGUI } from "client/constants";

@Controller()
export class MainUIController {
  private readonly screen = playerGUI.WaitForChild("Main");
  private readonly damageDisplay = this.screen.DamageDisplay;

  public enableDamageDisplay(humanoid: Humanoid): void {
    const healthBar = this.damageDisplay.Health;
    const health = humanoid.Health;
    healthBar.Amount.Text = tostring(health); // TODO: comma format
    healthBar.Bar.Size = UDim2.fromScale(health / humanoid.MaxHealth, 1);

    this.damageDisplay.Title.Text = humanoid.Parent!.Name.upper();
    this.damageDisplay.Visible = true;
  }

  public disableDamageDisplay(): void {
    this.damageDisplay.Visible = false;
  }
}