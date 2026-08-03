import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { computeStreak, loadPlayedDates } from "../game/dailyStats";
import { useGameData } from "../game/GameDataContext";
import { findDailyEntry, loadHistory } from "../game/history";
import { useDraftDispatch, useDraftState } from "../state/draftContext";
import { DraftScreen } from "./DraftScreen";
import { ResultScreen } from "./ResultScreen";

const ARCHIVE_DAYS = 14;

/** The last N days ending today, newest first, as YYYY-MM-DD.
 *
 * Built in UTC to match the server's own `today_utc()` — the endpoint would
 * happily serve a future date, so the list is clamped to today and backwards. */
function recentDates(todayDate, count) {
  const [y, m, d] = todayDate.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  return Array.from({ length: count }, (_, i) =>
    new Date(start - i * 86_400_000).toISOString().slice(0, 10)
  );
}

function shortDay(date) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** Past days, so missing one is a reason to come back rather than to give up. */
function Archive({ todayDate, onPick }) {
  const history = loadHistory();
  const played = new Map(
    history.filter((e) => e.kind === "daily" && e.dailyDate).map((e) => [e.dailyDate, e])
  );

  return (
    <div className="archive">
      <span className="archive__label">Archive</span>
      <div className="archive__grid">
        {recentDates(todayDate, ARCHIVE_DAYS).map((date) => {
          const entry = played.get(date);
          return (
            <button
              key={date}
              type="button"
              className={`archive__day${entry ? " archive__day--played" : ""}`}
              disabled={!!entry}
              onClick={() => onPick(date)}
            >
              <span className="archive__day-date">{shortDay(date)}</span>
              <span className="archive__day-result">
                {entry
                  ? `${entry.season.wins}-${entry.season.draws}-${entry.season.losses}`
                  : "Play"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

/** Shown when the day's draft has already been played. */
function AlreadyPlayed({ entry, todayDate, streak, onPickDate, onBackToModes }) {
  const { season } = entry;
  const isToday = entry.dailyDate === todayDate;
  return (
    <div className="formation-picker">
      <span className="formation-picker__eyebrow">Daily Draft</span>
      <h1 className="formation-picker__title">
        {isToday ? "You've played today" : "Already played"}
      </h1>
      <p className="formation-picker__subtitle">
        {formatDay(entry.dailyDate)}
        {isToday ? " — come back tomorrow for a new puzzle." : ""}
      </p>
      {streak.current > 1 && (
        <p className="streak-banner">
          <span className="streak-banner__flame">🔥</span>
          {streak.current} day streak
          {streak.best > streak.current ? ` · best ${streak.best}` : ""}
        </p>
      )}
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
      <Archive todayDate={todayDate} onPick={onPickDate} />
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
  // null = today. Set to a YYYY-MM-DD to replay a day from the archive.
  const [pickedDate, setPickedDate] = useState(null);
  // Today's date comes from the server (UTC) so it can't be clock-travelled;
  // hold onto it once known, since the archive is drawn relative to it.
  const [todayDate, setTodayDate] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api
      .daily(pickedDate ?? undefined)
      .then((day) => {
        if (cancelled) return;
        setDaily(day);
        if (!pickedDate) setTodayDate(day.date);
        const already = findDailyEntry(day.date);
        if (already) {
          setPlayedEntry(already);
          return;
        }
        setPlayedEntry(null);
        const formation = formations.find((f) => f.id === day.formationId);
        if (!formation) {
          setError(`The formation for ${day.date} (${day.formationId}) is not available.`);
          return;
        }
        dispatch({
          type: "START_SESSION",
          formation,
          mode: "daily",
          dailySequence: day.combos,
          dailyDate: day.date,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load the daily draft.");
      });

    return () => {
      cancelled = true;
    };
  }, [formations, dispatch, pickedDate]);

  const streak = computeStreak(loadPlayedDates(), todayDate ?? daily?.date ?? "1970-01-01");
  const handlePickDate = useCallback((date) => {
    setError(null);
    setDaily(null);
    setPlayedEntry(null);
    setPickedDate(date);
  }, []);

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
    return (
      <AlreadyPlayed
        entry={playedEntry}
        todayDate={todayDate ?? playedEntry.dailyDate}
        streak={streak}
        onPickDate={handlePickDate}
        onBackToModes={onBackToModes}
      />
    );
  }

  if (!daily || !state.formation) {
    return <div className="app-loading">Loading the daily draft…</div>;
  }

  // A daily is one attempt, so finishing it leads back out rather than into a
  // rerun — the result is already recorded in history at this point.
  if (state.phase === "complete") {
    return <ResultScreen onAgain={onBackToModes} againLabel="Back to modes" />;
  }

  return (
    <>
      <div className="daily-banner">
        <span className="daily-banner__label">
          Daily Draft{todayDate && daily.date !== todayDate ? " · Archive" : ""}
        </span>
        <span className="daily-banner__date">{formatDay(daily.date)}</span>
        {streak.current > 0 && (
          <span className="daily-banner__streak">🔥 {streak.current}</span>
        )}
        <span className="daily-banner__formation">{daily.formationId}</span>
      </div>
      <DraftScreen />
    </>
  );
}
