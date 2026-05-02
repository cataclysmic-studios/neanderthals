export const enum ItemID {
  Rock = "neanderthals:rock",
  WoodAxe = "neanderthals:wood_axe",
  WoodPickaxe = "neanderthals:wood_pickaxe",
  StoneAxe = "neanderthals:stone_axe",
  StonePickaxe = "neanderthals:stone_pickaxe",
  IronAxe = "neanderthals:iron_axe",
  IronPickaxe = "neanderthals:iron_pickaxe",
  Club = "neanderthals:club",
  Mace = "neanderthals:mace",
  GodRock = "neanderthals:god_rock",
  Flux = "neanderthals:flux",
  RawPork = "neanderthals:raw_pork",
  CookedPork = "neanderthals:cooked_pork",
  RawBeef = "neanderthals:raw_beef",
  CookedBeef = "neanderthals:cooked_beef",
  Stick = "neanderthals:stick",
  Log = "neanderthals:log",
  Leaves = "neanderthals:leaves",
  Stone = "neanderthals:stone",
  RawIron = "neanderthals:raw_iron",
  IronBar = "neanderthals:iron_bar",
  RawGold = "neanderthals:raw_gold",
  GoldBar = "neanderthals:gold_bar",
}

/** Items which may only have one copy in a players inventory and may not be dropped */
export const EXCLUSIVE_IDS = new Set<string>([
  ItemID.GodRock,
  ItemID.Rock
]);