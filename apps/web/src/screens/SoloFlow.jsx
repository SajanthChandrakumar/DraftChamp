import { useDraftState } from "../state/draftContext";
import { HomeScreen } from "./HomeScreen";
import { DraftScreen } from "./DraftScreen";
import { ResultScreen } from "./ResultScreen";

export function SoloFlow({ mode, onBackToModes }) {
  const state = useDraftState();

  switch (state.phase) {
    case "picking-formation":
      return <HomeScreen mode={mode} onBackToModes={onBackToModes} />;
    case "complete":
      return <ResultScreen />;
    default:
      return <DraftScreen />;
  }
}
