export type PlayerId = number;
export type TeamCode = string;
export type Season = number;

/** Broad position families used for slot eligibility. */
export type PositionFamily = "GK" | "DEF" | "MID" | "FWD";

/** Concrete position abbreviations a player can be listed as. */
export type Position =
  | "GK"
  | "CB" | "LB" | "RB" | "LWB" | "RWB"
  | "CDM" | "CM" | "CAM" | "LM" | "RM"
  | "LW" | "RW" | "ST" | "CF";

export interface Player {
  id: PlayerId;
  name: string;
  positions: Position[]; // ordered, primary first
  overall: number; // 0-99 headline rating
  age: number;
  shirtNumber?: number;
  attributes: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
}

export interface Team {
  code: TeamCode;
  name: string;
  crestUrl?: string; // deliberately optional/empty in v1, no crest assets
}

/** A club+season pairing the spin can draw. */
export type Combo = readonly [TeamCode, Season];

/** Key format: `${TeamCode}|${Season}`, e.g. "EVE|2017" */
export type SquadKey = `${TeamCode}|${Season}`;

export interface LeagueData {
  id: string;
  displayName: string;
  teams: Record<TeamCode, Team>;
  years: Season[];
  combos: Combo[];
  squads: Record<SquadKey, Player[]>;
  dataVersion: string;
}

export interface League {
  id: string;
  loadData: () => Promise<LeagueData>;
}

export function squadKey(combo: Combo): SquadKey {
  return `${combo[0]}|${combo[1]}`;
}
