import { describe, expect, it } from "vitest";
import {
  buildDailyShareText,
  computeStreak,
  loadPlayedDates,
  recordDailyPlay,
  summarise,
  utcDateOf,
} from "../src/game/dailyStats";

/** Matches the shim in history.test.js — Vitest's "node" environment has no
 * global localStorage. */
function fakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}

/** A same-day play: the timestamp's UTC date matches the puzzle's date. */
const sameDay = (date) => `${date}T12:00:00.000Z`;

describe("computeStreak", () => {
  it("is zero with no plays", () => {
    expect(computeStreak([], "2026-08-03")).toEqual({
      current: 0,
      best: 0,
      playedToday: false,
    });
  });

  it("counts consecutive days up to today", () => {
    const dates = ["2026-08-01", "2026-08-02", "2026-08-03"];
    expect(computeStreak(dates, "2026-08-03")).toEqual({
      current: 3,
      best: 3,
      playedToday: true,
    });
  });

  it("keeps yesterday's streak alive before today is played", () => {
    const dates = ["2026-08-01", "2026-08-02"];
    const streak = computeStreak(dates, "2026-08-03");
    expect(streak.current).toBe(2);
    expect(streak.playedToday).toBe(false);
  });

  it("breaks the current streak once a full day is missed", () => {
    // Played through the 2nd, then nothing on the 3rd — by the 4th it's gone.
    const dates = ["2026-08-01", "2026-08-02"];
    const streak = computeStreak(dates, "2026-08-04");
    expect(streak.current).toBe(0);
    expect(streak.best).toBe(2);
  });

  it("remembers the best run even after the current one breaks", () => {
    const dates = [
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
      "2026-07-04", // a 4-day run
      "2026-08-03", // then a lone play much later
    ];
    expect(computeStreak(dates, "2026-08-03")).toEqual({
      current: 1,
      best: 4,
      playedToday: true,
    });
  });

  it("counts a month boundary as consecutive", () => {
    const dates = ["2026-07-31", "2026-08-01"];
    expect(computeStreak(dates, "2026-08-01").current).toBe(2);
  });

  it("ignores duplicate dates", () => {
    const dates = ["2026-08-01", "2026-08-01", "2026-08-02"];
    expect(computeStreak(dates, "2026-08-02").current).toBe(2);
  });
});

describe("recordDailyPlay", () => {
  it("stores a play made on its own day", () => {
    const storage = fakeStorage();
    recordDailyPlay("2026-08-03", sameDay("2026-08-03"), storage);
    expect(loadPlayedDates(storage)).toEqual(["2026-08-03"]);
  });

  it("does not let an archive run extend the streak", () => {
    // Replaying the 1st while it is actually the 3rd must not count.
    const storage = fakeStorage();
    recordDailyPlay("2026-08-01", sameDay("2026-08-03"), storage);
    expect(loadPlayedDates(storage)).toEqual([]);
  });

  it("is idempotent for a date already recorded", () => {
    const storage = fakeStorage();
    recordDailyPlay("2026-08-03", sameDay("2026-08-03"), storage);
    recordDailyPlay("2026-08-03", sameDay("2026-08-03"), storage);
    expect(loadPlayedDates(storage)).toEqual(["2026-08-03"]);
  });

  it("keeps dates sorted regardless of insertion order", () => {
    const storage = fakeStorage();
    recordDailyPlay("2026-08-03", sameDay("2026-08-03"), storage);
    recordDailyPlay("2026-08-02", sameDay("2026-08-02"), storage);
    expect(loadPlayedDates(storage)).toEqual(["2026-08-02", "2026-08-03"]);
  });

  it("recovers from a corrupted record", () => {
    const storage = fakeStorage();
    storage.setItem("draftchamp:daily", "{not json");
    expect(loadPlayedDates(storage)).toEqual([]);
  });
});

describe("utcDateOf", () => {
  it("reads the UTC calendar date off a timestamp", () => {
    expect(utcDateOf("2026-08-03T23:30:00.000Z")).toBe("2026-08-03");
  });
});

describe("summarise", () => {
  const entries = [
    { kind: "daily", challengesAchieved: 2, season: { points: 104, tier: "Legendary" } },
    { kind: "solo", challengesAchieved: 1, season: { points: 70, tier: "Solid" } },
    { kind: "duel" },
  ];

  it("totals drafts, dailies and records broken", () => {
    const s = summarise(entries);
    expect(s.drafts).toBe(3);
    expect(s.dailies).toBe(1);
    expect(s.recordsBroken).toBe(3);
  });

  it("reports the best season", () => {
    const s = summarise(entries);
    expect(s.bestPoints).toBe(104);
    expect(s.bestTier).toBe("Legendary");
  });

  it("handles an empty history", () => {
    expect(summarise([])).toEqual({
      drafts: 0,
      dailies: 0,
      recordsBroken: 0,
      bestPoints: null,
      bestTier: null,
    });
  });
});

describe("buildDailyShareText", () => {
  const entry = {
    dailyDate: "2026-08-03",
    formationId: "4-3-3",
    season: { wins: 33, draws: 5, losses: 0, points: 104 },
    challenges: [
      { achieved: true },
      { achieved: true },
      { achieved: false },
      { achieved: true },
      { achieved: false },
      { achieved: true },
    ],
  };

  it("renders the result as a spoiler-free grid", () => {
    const text = buildDailyShareText(entry, 5);
    expect(text).toContain("DraftChamp Daily · 2026-08-03");
    expect(text).toContain("4-3-3 — 33W 5D 0L, 104 pts");
    expect(text).toContain("🟩🟩⬛🟩⬛🟩");
    expect(text).toContain("🔥 5 day streak");
  });

  it("names no players, so posting it spoils nothing", () => {
    expect(buildDailyShareText(entry, 5)).not.toMatch(/[A-Z]\.\s/);
  });

  it("omits the streak line below two days", () => {
    expect(buildDailyShareText(entry, 1)).not.toContain("streak");
  });
});
