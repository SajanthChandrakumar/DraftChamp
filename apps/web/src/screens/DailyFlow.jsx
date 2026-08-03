import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { useGameData } from "../game/GameDataContext";
import { findDailyEntry } from "../game/history";
import { useDraftDispatch, useDraftState } from "../state/draftContext";
import { DraftScreen } from "./DraftScreen";
import { ResultScreen } from "./ResultScreen";

function formatDay(date) {
  // The date is a plain YYYY-MM-DD with no timezone, so build it as local
  // parts — `new Date("2026-08-03")` would parse as UTC midnight and can slide
  // to the previous day west of Greenwich.
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Shown when today's draft has already been played. */
function AlreadyPlayed({ entry, onBackToModes }) {
  const { season } = entry;
  return (
    <div className="formation-picker">
      <span className="formation-picker__eyebrow">Daily Draft</span>
      <h1 className="formation-picker__title">You've played today</h1>
      <p className="formation-picker__subtitle">
        {formatDay(entry.dailyDate)} — come back tomorrow for a new puzzle.
      </p>
      <div className="daily-recap">
        <span className="daily-recap__record">
          {season.wins}-{season.draws}-{season.losses}
        </span>
        <span className="daily-recap__meta">
          {season.points} pts &middot; {season.tier}
        </span>
        <span className="daily-recap__records">
          {entry.challengesAchieved}/{entry.challenges.length} records broken
        </span>
      </div>
      <button type="button" className="formation-picker__back" onClick={onBackToModes}>
        &larr; Choose a different mode
      </button>
    </div>
  );
}

export function DailyFlow({ onBackToModes }) {
  const { formations } = useGameData();
  const state = useDraftState();
  const dispatch = useDraftDispatch();
  const [daily, setDaily] = useState(null);
  const [playedEntry, setPlayedEntry] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api
      .daily()
      .then((today) => {
        if (cancelled) return;
        setDaily(today);
        const already = findDailyEntry(today.date);
        if (already) {
          setPlayedEntry(already);
          return;
        }
        const formation = formations.find((f) => f.id === today.formationId);
        if (!formation) {
          setError(`Today's formation ${today.formationId} is not available.`);
          return;
        }
        dispatch({
          type: "START_SESSION",
          formation,
          mode: "daily",
          dailySequence: today.combos,
          dailyDate: today.date,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load today's draft.");
      });

    return () => {
      cancelled = true;
    };
  }, [formations, dispatch]);

  if (error) {
    return (
      <div className="app-empty">
        <h1>Daily Draft</h1>
        <p>{error}</p>
        <button type="button" className="formation-picker__back" onClick={onBackToModes}>
          &larr; Choose a different mode
        </button>
      </div>
    );
  }

  if (playedEntry) {
    return <AlreadyPlayed entry={playedEntry} onBackToModes={onBackToModes} />;
  }

  if (!daily || !state.formation) {
    return <div className="app-loading">Loading today's draft…</div>;
  }

  // A daily is one attempt, so finishing it leads back out rather than into a
  // rerun — the result is already recorded in history at this point.
  if (state.phase === "complete") {
    return <ResultScreen onAgain={onBackToModes} againLabel="Back to modes" />;
  }

  return (
    <>
      <div className="daily-banner">
        <span className="daily-banner__label">Daily Draft</span>
        <span className="daily-banner__date">{formatDay(daily.date)}</span>
        <span className="daily-banner__formation">{daily.formationId}</span>
      </div>
      <DraftScreen />
    </>
  );
}
