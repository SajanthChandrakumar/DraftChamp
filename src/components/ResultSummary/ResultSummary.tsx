import type { Player } from "../../leagues/types";
import type { SeasonRecord } from "../../engine/simulation";

export interface ResultSummaryProps {
  record: SeasonRecord;
  filledSlots: Record<string, Player>;
}

export function ResultSummary({ record, filledSlots }: ResultSummaryProps) {
  const players = Object.values(filledSlots);
  const topPlayer = players.find((p) => p.id === record.topPlayerId);
  const topScorer = players.find((p) => p.id === record.topScorerId);

  return (
    <div className="result-summary">
      <span className="result-summary__eyebrow">Full time</span>
      <h2 className="result-summary__tier">{record.tier}</h2>
      <p className="result-summary__record">
        {record.wins}-{record.draws}-{record.losses}
        <span className="result-summary__meta">
          {record.points} pts &middot; P{record.leaguePosition}
        </span>
      </p>
      <dl className="result-summary__standouts">
        {topPlayer && (
          <div>
            <dt>Top player</dt>
            <dd>{topPlayer.name}</dd>
          </div>
        )}
        {topScorer && (
          <div>
            <dt>Top scorer</dt>
            <dd>{topScorer.name}</dd>
          </div>
        )}
      </dl>
      <p className="result-summary__narrative">{record.narrative}</p>
    </div>
  );
}
