import { useMemo } from "react";
import { simulateSeason } from "../engine/simulation";
import { useDuelDispatch, useDuelState } from "../state/duelContext";

export function DuelResultScreen() {
  const state = useDuelState();
  const dispatch = useDuelDispatch();

  const recordA = useMemo(
    () => (state.formationA ? simulateSeason(state.filledSlotsA, state.formationA) : null),
    [state.filledSlotsA, state.formationA]
  );
  const recordB = useMemo(
    () => (state.formationB ? simulateSeason(state.filledSlotsB, state.formationB) : null),
    [state.filledSlotsB, state.formationB]
  );

  if (!recordA || !recordB) return null;

  const winner =
    recordA.points === recordB.points
      ? "draw"
      : recordA.points > recordB.points
        ? "A"
        : "B";

  return (
    <div className="result-screen">
      <span className="result-summary__eyebrow">Full time</span>
      <h2 className="result-summary__tier">
        {winner === "draw" ? "It's a draw" : `Player ${winner} wins`}
      </h2>
      <div className="duel-result">
        <div className="duel-result__side">
          <span className="duel-result__label">Player A &middot; {state.formationA}</span>
          <span className="duel-result__record">
            {recordA.wins}-{recordA.draws}-{recordA.losses}
          </span>
          <span className="duel-result__points">{recordA.points} pts &middot; {recordA.tier}</span>
        </div>
        <div className="duel-result__vs">vs</div>
        <div className="duel-result__side">
          <span className="duel-result__label">Player B &middot; {state.formationB}</span>
          <span className="duel-result__record">
            {recordB.wins}-{recordB.draws}-{recordB.losses}
          </span>
          <span className="duel-result__points">{recordB.points} pts &middot; {recordB.tier}</span>
        </div>
      </div>
      <button type="button" className="result-screen__again" onClick={() => dispatch({ type: "RESET" })}>
        Rematch
      </button>
    </div>
  );
}
