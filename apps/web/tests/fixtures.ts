// TEST FIXTURE ONLY — synthetic data, not real players.
import type { Formation, Player, Position } from "../src/api/types";
import type { PositionFamilyMap } from "../src/game/eligibility";

export const POS_TO_FAM: PositionFamilyMap = {
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

export const FORMATION_433: Formation = {
  id: "4-3-3",
  slots: [
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
};

export function player(
  id: number,
  positions: Position[] = ["CM"],
  overrides: Partial<Player> = {}
): Player {
  const overall = overrides.overall ?? 75;
  return {
    id,
    name: `Player ${id}`,
    positions,
    overall,
    age: 25,
    attributes: {
      pace: overall,
      shooting: overall,
      passing: overall,
      dribbling: overall,
      defending: overall,
      physical: overall,
    },
    ...overrides,
  };
}

/** One eligible player per slot of a 4-3-3, ids 101..111. */
export const POSITION_BY_FAMILY: Record<string, Position> = {
  GK: "GK",
  DEF: "CB",
  MID: "CM",
  FWD: "ST",
};
