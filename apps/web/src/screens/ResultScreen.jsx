import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { ChallengeList } from "../components/ChallengeList";
import { ResultSummary } from "../components/ResultSummary";
import { ShareCard } from "../components/ShareCard";
import { toSlotAssignments, useDraftDispatch, useDraftState } from "../state/draftContext";

export function ResultScreen() {
  const state = useDraftState();
  const dispatch = useDraftDispatch();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!state.formation) return;
    let cancelled = false;

    api
      .simulate({
        formationId: state.formation.id,
        slots: toSlotAssignments(state.filled),
        mode: state.mode,
        budgetCap: state.budgetCap,
      })
      .then((response) => {
        if (!cancelled) setResult(response);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not simulate the season.");
      });

    return () => {
      cancelled = true;
    };
  }, [state.formation, state.filled, state.mode, state.budgetCap]);

  if (error) {
    return (
      <div className="result-screen">
        <p className="draft-screen__error">{error}</p>
        <button
          type="button"
          className="result-screen__again"
          onClick={() => dispatch({ type: "RESET" })}
        >
          Draft again
        </button>
      </div>
    );
  }

  if (!result) {
    return <div className="app-loading">Playing the season…</div>;
  }

  return (
    <div className="result-screen">
      <ResultSummary season={result.season} />
      <ChallengeList
        challenges={result.challenges}
        achievedCount={result.challengesAchieved}
      />
      {result.totalSpent != null && (
        <p className="result-screen__spend">
          Squad cost: €{(result.totalSpent / 1_000_000).toFixed(1)}M
        </p>
      )}
      <ShareCard season={result.season} challengesAchieved={result.challengesAchieved} />
      <button
        type="button"
        className="result-screen__again"
        onClick={() => dispatch({ type: "RESET" })}
      >
        Draft again
      </button>
    </div>
  );
}
