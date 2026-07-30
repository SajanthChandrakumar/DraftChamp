import { useDuelState } from "../state/duelContext";
import { DuelSetupScreen } from "./DuelSetupScreen";
import { DuelDraftScreen } from "./DuelDraftScreen";
import { DuelResultScreen } from "./DuelResultScreen";

export function DuelFlow({ onBackToModes }) {
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
