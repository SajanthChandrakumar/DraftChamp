import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { ChallengeList } from "../components/ChallengeList";
import { ChemistryCard } from "../components/ChemistryCard";
import { ResultSummary } from "../components/ResultSummary";
import { ShareCard } from "../components/ShareCard";
import { computeStreak, recordDailyPlay } from "../game/dailyStats";
import { addHistoryEntry } from "../game/history";
import { toSlotAssignments, useDraftDispatch, useDraftState } from "../state/draftContext";

export function ResultScreen({ onAgain, againLabel = "Draft again" }) {
  const state = useDraftState();
  const dispatch = useDraftDispatch();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [streak, setStreak] = useState(0);
  const savedRef = useRef(false);

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

  useEffect(() => {
    if (!result || savedRef.current) return;
    savedRef.current = true;
    const playedAt = new Date().toISOString();
    addHistoryEntry({
      kind: state.mode === "daily" ? "daily" : "solo",
      mode: state.mode,
      dailyDate: state.dailyDate,
      formationId: state.formation?.id,
      season: result.season,
      challenges: result.challenges,
      challengesAchieved: result.challengesAchieved,
      totalSpent: result.totalSpent,
    });
    if (state.mode === "daily") {
      // Only extends the streak if this was played on its own day; an archive
      // run still lands in history but can't inflate the count.
      const dates = recordDailyPlay(state.dailyDate, playedAt);
      setStreak(computeStreak(dates, state.dailyDate).current);
    }
  }, [result, state.mode, state.formation, state.dailyDate]);

  if (error) {
    return (
      <div className="result-screen">
        <p className="draft-screen__error">{error}</p>
        <button
          type="button"
          className="result-screen__again"
          onClick={() => (onAgain ? onAgain() : dispatch({ type: "RESET" }))}
        >
          {againLabel}
        </button>
      </div>
    );
  }

  if (!result) {
    return <div className="app-loading">Playing the season…</div>;
  }

  const dailyEntry =
    state.mode === "daily"
      ? {
          dailyDate: state.dailyDate,
          formationId: state.formation?.id,
          season: result.season,
          challenges: result.challenges,
        }
      : null;

  return (
    <div className="result-screen">
      {streak > 1 && (
        <p className="streak-banner">
          <span className="streak-banner__flame">🔥</span>
          {streak} day streak — come back tomorrow to keep it alive.
        </p>
      )}
      <ResultSummary season={result.season} />
      <ChallengeList
        challenges={result.challenges}
        achievedCount={result.challengesAchieved}
      />
      <ChemistryCard chemistry={result.chemistry} />
      {result.totalSpent != null && (
        <p className="result-screen__spend">
          Squad cost: €{(result.totalSpent / 1_000_000).toFixed(1)}M
        </p>
      )}
      <ShareCard
        season={result.season}
        challengesAchieved={result.challengesAchieved}
        dailyEntry={dailyEntry}
        streak={streak}
      />
      <button
        type="button"
        className="result-screen__again"
        onClick={() => (onAgain ? onAgain() : dispatch({ type: "RESET" }))}
      >
        {againLabel}
      </button>
    </div>
  );
}
