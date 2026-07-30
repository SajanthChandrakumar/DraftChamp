import { useMemo } from "react";
import { simulateSeason } from "../engine/simulation";
import { ShareCard } from "../components/ShareCard";
import { ResultSummary } from "../components/ResultSummary";
import { useDraftDispatch, useDraftState } from "../state/draftContext";

export function ResultScreen() {
  const state = useDraftState();
  const dispatch = useDraftDispatch();

  const record = useMemo(() => {
    if (!state.formationId) return null;
    return simulateSeason(state.filledSlots, state.formationId);
  }, [state.filledSlots, state.formationId]);

  if (!record) return null;

  return (
    <div className="result-screen">
      <ResultSummary record={record} filledSlots={state.filledSlots} />
      <ShareCard record={record} filledSlots={state.filledSlots} />
      <button type="button" className="result-screen__again" onClick={() => dispatch({ type: "RESET" })}>
        Draft again
      </button>
    </div>
  );
}
