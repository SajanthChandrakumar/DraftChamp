/**
 * Daily streak tracking and history aggregates.
 *
 * Streaks live in their own localStorage record rather than being derived from
 * `history.js`: that store is capped at MAX_ENTRIES, so a run of Classic or
 * Budget drafts would quietly evict old dailies and destroy a long streak.
 * Here we keep only the completed dates — a full year is a few KB — and derive
 * current/best from them on read, so the number is always recomputable rather
 * than a counter that can drift out of sync.
 *
 * Storage is injectable (defaults to `window.localStorage`) to match the
 * `history.js` convention and stay testable under Vitest's "node" environment.
 */

const STORAGE_KEY = "draftchamp:daily";
const DAY_MS = 86_400_000;

function readDates(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const dates = parsed?.playedDates;
    return Array.isArray(dates) ? dates.filter((d) => typeof d === "string") : [];
  } catch {
    return [];
  }
}

function writeDates(dates, storage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ playedDates: dates }));
  } catch {
    // Storage full or unavailable — the streak just won't extend this time.
  }
}

/** YYYY-MM-DD -> epoch ms at UTC midnight.
 *
 * Parsed from parts rather than `new Date("YYYY-MM-DD")` so the value is
 * anchored to UTC and can't slide a day depending on the viewer's timezone —
 * the same trap `DailyFlow.formatDay` documents. */
function dayValue(date) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** The UTC calendar date of an ISO timestamp, as YYYY-MM-DD. */
export function utcDateOf(isoTimestamp) {
  return new Date(isoTimestamp).toISOString().slice(0, 10);
}

export function loadPlayedDates(storage = window.localStorage) {
  return readDates(storage);
}

/**
 * Record a completed daily, but only when it was played on its own day.
 *
 * Archive runs (replaying a day you missed) still get saved to history and
 * still count toward the aggregate stats — they just can't extend the streak,
 * which would otherwise let anyone fabricate a 365-day run in an afternoon.
 * `playedAt` is already written by `addHistoryEntry`, so this needs no new data.
 */
export function recordDailyPlay(dailyDate, playedAt, storage = window.localStorage) {
  if (!dailyDate || utcDateOf(playedAt) !== dailyDate) return readDates(storage);
  const dates = readDates(storage);
  if (dates.includes(dailyDate)) return dates;
  const next = [...dates, dailyDate].sort();
  writeDates(next, storage);
  return next;
}

/**
 * Current and best run of consecutive days.
 *
 * The current streak survives until a whole day is missed: finishing yesterday
 * but not yet today still counts, so opening the app in the morning doesn't
 * show a demoralising zero before you've had a chance to play.
 */
export function computeStreak(playedDates, todayDate) {
  const unique = [...new Set(playedDates)].sort();
  if (unique.length === 0) return { current: 0, best: 0, playedToday: false };

  let best = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i += 1) {
    const consecutive = dayValue(unique[i]) - dayValue(unique[i - 1]) === DAY_MS;
    run = consecutive ? run + 1 : 1;
    if (run > best) best = run;
  }

  const today = dayValue(todayDate);
  const last = dayValue(unique[unique.length - 1]);
  const gap = today - last;

  // Anything older than yesterday means the run is already broken.
  let current = 0;
  if (gap === 0 || gap === DAY_MS) {
    current = 1;
    for (let i = unique.length - 1; i > 0; i -= 1) {
      if (dayValue(unique[i]) - dayValue(unique[i - 1]) !== DAY_MS) break;
      current += 1;
    }
  }

  return { current, best, playedToday: gap === 0 };
}

/** Headline numbers for the stats dashboard, over whatever history is retained. */
export function summarise(entries) {
  const solo = entries.filter((e) => e.kind === "solo" || e.kind === "daily");
  const best = solo.reduce(
    (acc, e) => (acc == null || (e.season?.points ?? 0) > acc.points ? { points: e.season.points, tier: e.season.tier } : acc),
    null
  );
  return {
    drafts: entries.length,
    dailies: entries.filter((e) => e.kind === "daily").length,
    recordsBroken: solo.reduce((n, e) => n + (e.challengesAchieved ?? 0), 0),
    bestPoints: best?.points ?? null,
    bestTier: best?.tier ?? null,
  };
}

/**
 * Spoiler-free share text, in the Wordle mould: it conveys how the day went
 * without naming a single player, so posting it can't ruin the puzzle for
 * anyone who hasn't played yet.
 */
export function buildDailyShareText(entry, streak) {
  const { season, challenges = [] } = entry;
  const squares = challenges.map((c) => (c.achieved ? "🟩" : "⬛")).join("");
  const lines = [
    `DraftChamp Daily · ${entry.dailyDate}`,
    `${entry.formationId} — ${season.wins}W ${season.draws}D ${season.losses}L, ${season.points} pts`,
    squares,
  ];
  if (streak > 1) lines.push(`🔥 ${streak} day streak`);
  return lines.join("\n");
}
