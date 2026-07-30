import type { LeagueData } from "../leagues/types";
import { useDuelState } from "../state/duelContext";
import { DuelSetupScreen } from "./DuelSetupScreen";
import { DuelDraftScreen } from "./DuelDraftScreen";
import { DuelResultScreen } from "./DuelResultScreen";

export interface DuelFlowProps {
  leagueData: LeagueData;
  onBackToModes: () => void;
}

export function DuelFlow({ leagueData, onBackToModes }: DuelFlowProps) {
  const state = useDuelState();

  switch (state.phase) {
    case "setup":
      return <DuelSetupScreen onBackToModes={onBackToModes} />;
    case "complete":
      return <DuelResultScreen />;
    default:
      return <DuelDraftScreen leagueData={leagueData} />;
  }
}
