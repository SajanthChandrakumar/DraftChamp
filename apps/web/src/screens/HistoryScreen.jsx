import { useState } from "react";
import { computeStreak, loadPlayedDates, summarise } from "../game/dailyStats";
import { clearHistory, loadHistory } from "../game/history";

function StatTile({ label, value, hint }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile__value">{value}</span>
      <span className="stat-tile__label">{label}</span>
      {hint && <span className="stat-tile__hint">{hint}</span>}
    </div>
  );
}

/** The reason to come back: progress you can see accumulating. */
function StatsPanel({ entries }) {
  const stats = summarise(entries);
  const today = new Date().toISOString().slice(0, 10);
  const streak = computeStreak(loadPlayedDates(), today);

  return (
    <div className="stats-panel">
      <StatTile
        label="Current streak"
        value={streak.current > 0 ? `🔥 ${streak.current}` : "—"}
        hint={streak.best > 0 ? `best ${streak.best}` : null}
      />
      <StatTile label="Drafts played" value={stats.drafts} hint={`${stats.dailies} daily`} />
      <StatTile label="Records broken" value={stats.recordsBroken} />
      <StatTile
        label="Best season"
        value={stats.bestPoints != null ? `${stats.bestPoints} pts` : "—"}
        hint={stats.bestTier}
      />
    </div>
  );
}

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
        <h1 className="history-screen__title">Draft history</h1>
        <button type="button" className="formation-picker__back" onClick={onBack}>
          Back
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="history-screen__empty">No drafts yet — play a season and it'll show up here.</p>
      ) : (
        <>
          <StatsPanel entries={entries} />
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
