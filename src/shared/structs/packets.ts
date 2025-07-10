export interface DamagePacket {
  readonly humanoid: Humanoid;
  readonly toolName: ToolName;
}

export interface ToolEquipReplicationPacket {
  readonly player: Player;
  readonly tool: ToolItem;
}