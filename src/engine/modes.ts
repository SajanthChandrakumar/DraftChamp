export type GameModeId = "classic" | "record-chase" | "budget" | "peak-xi" | "duel";

export interface GameModeInfo {
  id: GameModeId;
  label: string;
  description: string;
}

export const GAME_MODES: GameModeInfo[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Spin any club-season, draft your XI, see how the season plays out.",
  },
  {
    id: "record-chase",
    label: "Record Chase",
    description: "Try to beat a real Premier League record with the XI you draft.",
  },
  {
    id: "budget",
    label: "Budget Draft",
    description: "Same draft, but every player costs money — build the best XI under a cap.",
  },
  {
    id: "peak-xi",
    label: "Peak XI",
    description: "Pick one club and mix eras — draft from any of its seasons in the dataset.",
  },
  {
    id: "duel",
    label: "Head-to-Head",
    description: "Two players, same device, draft from the same reveals and compare results.",
  },
];

export const DEFAULT_BUDGET_CAP = 900_000_000;
