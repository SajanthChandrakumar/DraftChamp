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
      <h2>{record.tier}</h2>
      <p className="result-summary__record">
        {record.wins}W {record.draws}D {record.losses}L &mdash; {record.points} pts &mdash; P{record.leaguePosition}
      </p>
      {topPlayer && <p>Top player: {topPlayer.name}</p>}
      {topScorer && <p>Top scorer: {topScorer.name}</p>}
      <p className="result-summary__narrative">{record.narrative}</p>
    </div>
  );
}
