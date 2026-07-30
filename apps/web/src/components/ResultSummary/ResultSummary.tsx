import type { SeasonResult } from "../../api/types";

export interface ResultSummaryProps {
  season: SeasonResult;
}

export function ResultSummary({ season }: ResultSummaryProps) {
  return (
    <div className="result-summary">
      <span className="result-summary__eyebrow">Full time</span>
      <h2 className="result-summary__tier">{season.tier}</h2>
      <p className="result-summary__record">
        {season.wins}-{season.draws}-{season.losses}
        <span className="result-summary__meta">
          {season.points} pts &middot; P{season.leaguePosition}
        </span>
      </p>
      <dl className="result-summary__standouts">
        <div>
          <dt>Scored</dt>
          <dd>{season.goalsFor}</dd>
        </div>
        <div>
          <dt>Conceded</dt>
          <dd>{season.goalsConceded}</dd>
        </div>
      </dl>
      <dl className="result-summary__standouts">
        <div>
          <dt>Top player</dt>
          <dd>{season.topPlayerName}</dd>
        </div>
        <div>
          <dt>Top scorer</dt>
          <dd>
            {season.topScorerName} ({season.topScorerGoals})
          </dd>
        </div>
      </dl>
      <p className="result-summary__narrative">{season.narrative}</p>
    </div>
  );
}
