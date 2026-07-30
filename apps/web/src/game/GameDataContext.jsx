import { createContext, useContext } from "react";

/** Static server data fetched once at startup: the rules of the game. */
const GameDataContext = createContext(null);

export function GameDataProvider({ value, children }) {
  return <GameDataContext.Provider value={value}>{children}</GameDataContext.Provider>;
}

export function useGameData() {
  const ctx = useContext(GameDataContext);
  if (!ctx) throw new Error("useGameData must be used within a GameDataProvider");
  return ctx;
}

export function useFormation(formationId) {
  const { formations } = useGameData();
  const formation = formations.find((f) => f.id === formationId);
  if (!formation) throw new Error(`Unknown formation ${formationId}`);
  return formation;
}
