import { describe, expect, it } from "vitest";
import {
  addHistoryEntry,
  clearHistory,
  findDailyEntry,
  loadHistory,
} from "../src/game/history";

/** Minimal in-memory Storage stand-in — Vitest's "node" environment has no
 * global localStorage, and this lets addHistoryEntry/loadHistory/clearHistory
 * be tested without adding jsdom as a dependency. */
function fakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}

describe("loadHistory", () => {
  it("is empty when nothing has been stored", () => {
    expect(loadHistory(fakeStorage())).toEqual([]);
  });

  it("recovers gracefully from corrupted JSON", () => {
    const storage = fakeStorage();
    storage.setItem("draftchamp:history", "{not json");
    expect(loadHistory(storage)).toEqual([]);
  });

  it("recovers gracefully from a non-array payload", () => {
    const storage = fakeStorage();
    storage.setItem("draftchamp:history", JSON.stringify({ oops: true }));
    expect(loadHistory(storage)).toEqual([]);
  });
});

describe("addHistoryEntry", () => {
  it("stores an entry with a generated id and timestamp", () => {
    const storage = fakeStorage();
    const entries = addHistoryEntry({ kind: "solo", mode: "classic" }, storage);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ kind: "solo", mode: "classic" });
    expect(entries[0].id).toBeTruthy();
    expect(entries[0].playedAt).toBeTruthy();
  });

  it("prepends new entries, newest first", () => {
    const storage = fakeStorage();
    addHistoryEntry({ kind: "solo", mode: "classic" }, storage);
    addHistoryEntry({ kind: "solo", mode: "budget" }, storage);
    const entries = loadHistory(storage);
    expect(entries).toHaveLength(2);
    expect(entries[0].mode).toBe("budget");
    expect(entries[1].mode).toBe("classic");
  });

  it("caps history at 200 entries, keeping the newest", () => {
    const storage = fakeStorage();
    for (let i = 0; i < 205; i++) {
      addHistoryEntry({ kind: "solo", mode: "classic", i }, storage);
    }
    const entries = loadHistory(storage);
    expect(entries).toHaveLength(200);
    expect(entries[0].i).toBe(204);
  });
});

describe("findDailyEntry", () => {
  it("is null when that day has not been played", () => {
    const storage = fakeStorage();
    addHistoryEntry({ kind: "daily", dailyDate: "2026-08-02" }, storage);
    expect(findDailyEntry("2026-08-03", storage)).toBeNull();
  });

  it("finds the entry for a played day", () => {
    const storage = fakeStorage();
    addHistoryEntry({ kind: "daily", dailyDate: "2026-08-03", challengesAchieved: 2 }, storage);
    expect(findDailyEntry("2026-08-03", storage)).toMatchObject({ challengesAchieved: 2 });
  });

  it("ignores non-daily entries that happen to carry a date", () => {
    const storage = fakeStorage();
    addHistoryEntry({ kind: "solo", dailyDate: "2026-08-03" }, storage);
    expect(findDailyEntry("2026-08-03", storage)).toBeNull();
  });
});

describe("clearHistory", () => {
  it("empties the stored history", () => {
    const storage = fakeStorage();
    addHistoryEntry({ kind: "solo", mode: "classic" }, storage);
    clearHistory(storage);
    expect(loadHistory(storage)).toEqual([]);
  });
});
