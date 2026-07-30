import type { ChallengeResult } from "../../api/types";

export interface ChallengeListProps {
  challenges: ChallengeResult[];
  achievedCount: number;
}

export function ChallengeList({ challenges, achievedCount }: ChallengeListProps) {
  return (
    <section className="challenges">
      <h3 className="challenges__heading">
        Records broken
        <span className="challenges__score">
          {achievedCount} / {challenges.length}
        </span>
      </h3>
      <ul className="challenges__list">
        {challenges.map((challenge) => (
          <li
            key={challenge.id}
            className={`challenge${challenge.achieved ? " challenge--achieved" : ""}`}
          >
            <span className="challenge__marker" aria-hidden="true">
              {challenge.achieved ? "✓" : "—"}
            </span>
            <div className="challenge__body">
              <span className="challenge__label">{challenge.label}</span>
              <span className="challenge__message">{challenge.message}</span>
            </div>
            <span className="challenge__figures">
              <span className="challenge__actual">{challenge.actual}</span>
              <span className="challenge__target">/ {challenge.target}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
