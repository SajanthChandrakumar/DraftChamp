import type { Player, Position, PositionFamily } from "../leagues/types";

export type SlotId = string;

export interface FormationSlot {
  id: SlotId;
  label: string;
  fam: PositionFamily;
  x: number; // percentage, 0-100, left offset on pitch
  y: number; // percentage, 0-100, top offset on pitch (92 = near own goal, 14 = near attack)
}

export type FormationId = "4-3-3" | "4-4-2" | "3-5-2";

export const FORMATIONS: Record<FormationId, FormationSlot[]> = {
  "4-3-3": [
    { id: "gk", label: "GK", fam: "GK", x: 50, y: 92 },
    { id: "lb", label: "LB", fam: "DEF", x: 15, y: 74 },
    { id: "cb1", label: "CB", fam: "DEF", x: 38, y: 78 },
    { id: "cb2", label: "CB", fam: "DEF", x: 62, y: 78 },
    { id: "rb", label: "RB", fam: "DEF", x: 85, y: 74 },
    { id: "cm1", label: "CM", fam: "MID", x: 30, y: 52 },
    { id: "cm2", label: "CM", fam: "MID", x: 50, y: 46 },
    { id: "cm3", label: "CM", fam: "MID", x: 70, y: 52 },
    { id: "lw", label: "LW", fam: "FWD", x: 18, y: 22 },
    { id: "st", label: "ST", fam: "FWD", x: 50, y: 14 },
    { id: "rw", label: "RW", fam: "FWD", x: 82, y: 22 },
  ],
  "4-4-2": [
    { id: "gk", label: "GK", fam: "GK", x: 50, y: 92 },
    { id: "lb", label: "LB", fam: "DEF", x: 15, y: 74 },
    { id: "cb1", label: "CB", fam: "DEF", x: 38, y: 78 },
    { id: "cb2", label: "CB", fam: "DEF", x: 62, y: 78 },
    { id: "rb", label: "RB", fam: "DEF", x: 85, y: 74 },
    { id: "lm", label: "LM", fam: "MID", x: 15, y: 48 },
    { id: "cm1", label: "CM", fam: "MID", x: 38, y: 50 },
    { id: "cm2", label: "CM", fam: "MID", x: 62, y: 50 },
    { id: "rm", label: "RM", fam: "MID", x: 85, y: 48 },
    { id: "st1", label: "ST", fam: "FWD", x: 38, y: 16 },
    { id: "st2", label: "ST", fam: "FWD", x: 62, y: 16 },
  ],
  "3-5-2": [
    { id: "gk", label: "GK", fam: "GK", x: 50, y: 92 },
    { id: "cb1", label: "CB", fam: "DEF", x: 30, y: 78 },
    { id: "cb2", label: "CB", fam: "DEF", x: 50, y: 80 },
    { id: "cb3", label: "CB", fam: "DEF", x: 70, y: 78 },
    { id: "lm", label: "LM", fam: "MID", x: 10, y: 50 },
    { id: "cm1", label: "CM", fam: "MID", x: 32, y: 54 },
    { id: "cm2", label: "CM", fam: "MID", x: 50, y: 48 },
    { id: "cm3", label: "CM", fam: "MID", x: 68, y: 54 },
    { id: "rm", label: "RM", fam: "MID", x: 90, y: 50 },
    { id: "st1", label: "ST", fam: "FWD", x: 38, y: 16 },
    { id: "st2", label: "ST", fam: "FWD", x: 62, y: 16 },
  ],
};

export const POS_TO_FAM: Record<Position, PositionFamily> = {
  GK: "GK",
  CB: "DEF",
  LB: "DEF",
  RB: "DEF",
  LWB: "DEF",
  RWB: "DEF",
  CDM: "MID",
  CM: "MID",
  CAM: "MID",
  LM: "MID",
  RM: "MID",
  LW: "FWD",
  RW: "FWD",
  ST: "FWD",
  CF: "FWD",
};

export function eligibleFamilies(player: Player): Set<PositionFamily> {
  return new Set(player.positions.map((p) => POS_TO_FAM[p]));
}

export function openSlotsFor(
  player: Player,
  formationId: FormationId,
  filledSlots: Record<SlotId, Player>
): FormationSlot[] {
  const fams = eligibleFamilies(player);
  return FORMATIONS[formationId].filter(
    (slot) => fams.has(slot.fam) && !filledSlots[slot.id]
  );
}

export function isDraftComplete(
  filledSlots: Record<SlotId, Player>,
  formationId: FormationId
): boolean {
  return FORMATIONS[formationId].every((slot) => !!filledSlots[slot.id]);
}
