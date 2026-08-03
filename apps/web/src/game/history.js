/**
 * Local draft history, persisted to localStorage. Storage is injectable
 * (defaults to `window.localStorage`) so this stays unit-testable under
 * Vitest's "node" environment, which has no global `localStorage`.
 */

const STORAGE_KEY = "draftchamp:history";
const MAX_ENTRIES = 50;

function readAll(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries, storage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or unavailable — the entry just won't persist this time.
  }
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadHistory(storage = window.localStorage) {
  return readAll(storage);
}

export function addHistoryEntry(entry, storage = window.localStorage) {
  const withMeta = { id: makeId(), playedAt: new Date().toISOString(), ...entry };
  const entries = [withMeta, ...readAll(storage)].slice(0, MAX_ENTRIES);
  writeAll(entries, storage);
  return entries;
}

export function clearHistory(storage = window.localStorage) {
  writeAll([], storage);
}

/** The Daily Draft is one attempt per day, so a finished entry for a date is
 * also the record of having played it. */
export function findDailyEntry(date, storage = window.localStorage) {
  return readAll(storage).find((e) => e.kind === "daily" && e.dailyDate === date) ?? null;
}
