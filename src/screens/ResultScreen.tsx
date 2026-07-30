import { useMemo } from "react";
import { simulateSeason } from "../engine/simulation";
import { compareToRecord, getRecordById } from "../engine/records";
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

  const recordChase = useMemo(() => {
    if (!record || !state.targetRecordId) return null;
    const target = getRecordById(state.targetRecordId);
    if (!target) return null;
    return { target, comparison: compareToRecord(record, target) };
  }, [record, state.targetRecordId]);

  if (!record) return null;

  return (
    <div className="result-screen">
      <ResultSummary record={record} filledSlots={state.filledSlots} />
      {recordChase && (
        <div
          className={`result-screen__record-chase${
            recordChase.comparison.achieved ? " result-screen__record-chase--achieved" : ""
          }`}
        >
          {recordChase.comparison.message}
        </div>
      )}
      <ShareCard record={record} filledSlots={state.filledSlots} />
      <button type="button" className="result-screen__again" onClick={() => dispatch({ type: "RESET" })}>
        Draft again
      </button>
    </div>
  );
}
