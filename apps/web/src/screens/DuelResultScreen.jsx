import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { toSlotAssignments } from "../state/draftContext";
import { useDuelDispatch, useDuelState } from "../state/duelContext";

export function DuelResultScreen() {
  const state = useDuelState();
  const dispatch = useDuelDispatch();
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!state.formationA || !state.formationB) return;
    let cancelled = false;

    Promise.all([
      api.simulate({
        formationId: state.formationA.id,
        slots: toSlotAssignments(state.filledA),
        mode: "duel",
      }),
      api.simulate({
        formationId: state.formationB.id,
        slots: toSlotAssignments(state.filledB),
        mode: "duel",
      }),
    ])
      .then(([a, b]) => {
        if (!cancelled) setResults({ a, b });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not simulate the duel.");
      });

    return () => {
      cancelled = true;
    };
  }, [state.formationA, state.formationB, state.filledA, state.filledB]);

  if (error) {
    return (
      <div className="result-screen">
        <p className="draft-screen__error">{error}</p>
        <button
          type="button"
          className="result-screen__again"
          onClick={() => dispatch({ type: "RESET" })}
        >
          Rematch
        </button>
      </div>
    );
  }

  if (!results) {
    return <div className="app-loading">Playing both seasons…</div>;
  }

  const { a, b } = results;
  // Points decide it; a tie on points falls to who broke more records.
  const winner =
    a.season.points !== b.season.points
      ? a.season.points > b.season.points
        ? "A"
        : "B"
      : a.challengesAchieved !== b.challengesAchieved
        ? a.challengesAchieved > b.challengesAchieved
          ? "A"
          : "B"
        : "draw";

  return (
    <div className="result-screen">
      <span className="result-summary__eyebrow">Full time</span>
      <h2 className="result-summary__tier">
        {winner === "draw" ? "It's a draw" : `Player ${winner} wins`}
      </h2>
      <div className="duel-result">
        <div className="duel-result__side">
          <span className="duel-result__label">Player A &middot; {state.formationA?.id}</span>
          <span className="duel-result__record">
            {a.season.wins}-{a.season.draws}-{a.season.losses}
          </span>
          <span className="duel-result__points">
            {a.season.points} pts &middot; {a.season.tier}
          </span>
          <span className="duel-result__records">
            {a.challengesAchieved} record{a.challengesAchieved === 1 ? "" : "s"} broken
          </span>
        </div>
        <div className="duel-result__vs">vs</div>
        <div className="duel-result__side">
          <span className="duel-result__label">Player B &middot; {state.formationB?.id}</span>
          <span className="duel-result__record">
            {b.season.wins}-{b.season.draws}-{b.season.losses}
          </span>
          <span className="duel-result__points">
            {b.season.points} pts &middot; {b.season.tier}
          </span>
          <span className="duel-result__records">
            {b.challengesAchieved} record{b.challengesAchieved === 1 ? "" : "s"} broken
          </span>
        </div>
      </div>
      <button
        type="button"
        className="result-screen__again"
        onClick={() => dispatch({ type: "RESET" })}
      >
        Rematch
      </button>
    </div>
  );
}
