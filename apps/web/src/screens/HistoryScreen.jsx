import { useState } from "react";
import { clearHistory, loadHistory } from "../game/history";

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SoloHistoryRow({ entry }) {
  const { season } = entry;
  return (
    <div className="history-entry__row">
      <div className="history-entry__main">
        <span className="history-entry__formation">
          {entry.kind === "daily" && <span className="history-entry__badge">Daily</span>}
          {entry.formationId}
        </span>
        <span className="history-entry__record">
          {season.wins}-{season.draws}-{season.losses} &middot; {season.points} pts &middot; {season.tier}
        </span>
        <span className="history-entry__challenges">
          {entry.challengesAchieved}/{entry.challenges.length} records broken
        </span>
      </div>
      <span className="history-entry__date">{formatDate(entry.playedAt)}</span>
    </div>
  );
}

function DuelHistoryRow({ entry }) {
  const { a, b, winner } = entry;
  return (
    <div className="history-entry__row">
      <div className="history-entry__main">
        <span className="history-entry__formation">
          {entry.formationIdA} vs {entry.formationIdB}
        </span>
        <span className="history-entry__record">
          A: {a.season.points} pts &middot; B: {b.season.points} pts
        </span>
        <span className="history-entry__challenges">
          {winner === "draw" ? "Draw" : `Player ${winner} won`}
        </span>
      </div>
      <span className="history-entry__date">{formatDate(entry.playedAt)}</span>
    </div>
  );
}

export function HistoryScreen({ onBack }) {
  const [entries, setEntries] = useState(() => loadHistory());

  const handleClear = () => {
    clearHistory();
    setEntries([]);
  };

  return (
    <div className="history-screen">
      <div className="history-screen__header">
        <div>
          <span className="mode-select__eyebrow">DraftChamp</span>
          <h1 className="history-screen__title">Draft history</h1>
        </div>
        <button type="button" className="formation-picker__back" onClick={onBack}>
          Back
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="history-screen__empty">No drafts yet — play a season and it'll show up here.</p>
      ) : (
        <>
          <ul className="history-screen__list">
            {entries.map((entry) => (
              <li key={entry.id} className="history-entry">
                {entry.kind === "duel" ? (
                  <DuelHistoryRow entry={entry} />
                ) : (
                  <SoloHistoryRow entry={entry} />
                )}
              </li>
            ))}
          </ul>
          <button type="button" className="history-screen__clear" onClick={handleClear}>
            Clear history
          </button>
        </>
      )}
    </div>
  );
}
