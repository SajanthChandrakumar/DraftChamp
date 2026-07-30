/**
 * Wire types for the DraftChamp API.
 *
 * These mirror the Pydantic models in `apps/api/app/models.py`, which are the
 * source of truth — the server derives its OpenAPI schema from them. Regenerate
 * or hand-check these if the API models change; `npm run typecheck:api` fetches
 * the live schema and diffs the shapes.
 */

export type PositionFamily = "GK" | "DEF" | "MID" | "FWD";

export type Position =
  | "GK"
  | "CB" | "LB" | "RB" | "LWB" | "RWB"
  | "CDM" | "CM" | "CAM" | "LM" | "RM"
  | "LW" | "RW" | "ST" | "CF";

export type GameModeId = "classic" | "budget" | "peak-xi" | "duel";

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface Player {
  id: number;
  name: string;
  positions: Position[];
  overall: number;
  age: number;
  shirtNumber?: number | null;
  marketValue?: number | null;
  attributes: PlayerAttributes;
}

export interface Team {
  code: string;
  name: string;
}

export interface Combo {
  team: string;
  season: number;
}

export interface FormationSlot {
  id: string;
  label: string;
  fam: PositionFamily;
  x: number;
  y: number;
}

export interface Formation {
  id: string;
  slots: FormationSlot[];
}

export interface LeagueMeta {
  id: string;
  displayName: string;
  teams: Team[];
  years: number[];
  combos: Combo[];
  dataVersion: string;
}

export interface SquadResponse {
  team: string;
  season: number;
  teamName: string;
  players: Player[];
}

export interface GameModeInfo {
  id: GameModeId;
  label: string;
  description: string;
  needsClub: boolean;
  hasBudget: boolean;
  defaultBudgetCap: number | null;
}

export interface RecordInfo {
  id: string;
  label: string;
  description: string;
  metric: string;
  value: number;
  holder: string;
  season: string;
  lowerIsBetter: boolean;
}

export interface ChallengeResult {
  id: string;
  label: string;
  holder: string;
  season: string;
  target: number;
  actual: number;
  achieved: boolean;
  message: string;
}

export interface SlotAssignment {
  slotId: string;
  playerId: number;
  team: string;
  season: number;
}

export interface SimulateRequest {
  formationId: string;
  slots: SlotAssignment[];
  mode?: GameModeId;
  budgetCap?: number | null;
}

export interface SeasonResult {
  wins: number;
  draws: number;
  losses: number;
  points: number;
  leaguePosition: number;
  tier: string;
  goalsFor: number;
  goalsConceded: number;
  topPlayerId: number;
  topPlayerName: string;
  topScorerId: number;
  topScorerName: string;
  topScorerGoals: number;
  squadStrength: number;
  narrative: string;
}

export interface SimulateResponse {
  season: SeasonResult;
  challenges: ChallengeResult[];
  challengesAchieved: number;
  totalSpent: number | null;
}
