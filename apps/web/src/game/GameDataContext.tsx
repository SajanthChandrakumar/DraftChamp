import { createContext, useContext, type ReactNode } from "react";
import type { Formation, GameModeInfo, LeagueMeta, RecordInfo } from "../api/types";
import type { PositionFamilyMap } from "./eligibility";

/** Static server data fetched once at startup: the rules of the game. */
export interface GameData {
  league: LeagueMeta;
  formations: Formation[];
  posToFam: PositionFamilyMap;
  modes: GameModeInfo[];
  records: RecordInfo[];
}

const GameDataContext = createContext<GameData | null>(null);

export function GameDataProvider({ value, children }: { value: GameData; children: ReactNode }) {
  return <GameDataContext.Provider value={value}>{children}</GameDataContext.Provider>;
}

export function useGameData(): GameData {
  const ctx = useContext(GameDataContext);
  if (!ctx) throw new Error("useGameData must be used within a GameDataProvider");
  return ctx;
}

export function useFormation(formationId: string): Formation {
  const { formations } = useGameData();
  const formation = formations.find((f) => f.id === formationId);
  if (!formation) throw new Error(`Unknown formation ${formationId}`);
  return formation;
}
