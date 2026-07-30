import { useDuelState } from "../state/duelContext";
import { DuelSetupScreen } from "./DuelSetupScreen";
import { DuelDraftScreen } from "./DuelDraftScreen";
import { DuelResultScreen } from "./DuelResultScreen";

export interface DuelFlowProps {
  onBackToModes: () => void;
}

export function DuelFlow({ onBackToModes }: DuelFlowProps) {
  const state = useDuelState();

  switch (state.phase) {
    case "setup":
      return <DuelSetupScreen onBackToModes={onBackToModes} />;
    case "complete":
      return <DuelResultScreen />;
    default:
      return <DuelDraftScreen />;
  }
}
