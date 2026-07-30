import { describe, expect, it } from "vitest";
import { compareToRecord, getRecordById, PL_RECORDS } from "../../src/engine/records";
import type { SeasonRecord } from "../../src/engine/simulation";

function seasonRecord(overrides: Partial<SeasonRecord>): SeasonRecord {
  return {
    wins: 20,
    draws: 10,
    losses: 8,
    points: 70,
    leaguePosition: 5,
    tier: "Solid",
    topPlayerId: 1,
    topScorerId: 2,
    topScorerGoals: 20,
    goalsFor: 60,
    goalsConceded: 40,
    narrative: "",
    ...overrides,
  };
}

describe("getRecordById", () => {
  it("finds every seeded record by id", () => {
    for (const record of PL_RECORDS) {
      expect(getRecordById(record.id)).toEqual(record);
    }
  });

  it("returns undefined for an unknown id", () => {
    expect(getRecordById("does-not-exist")).toBeUndefined();
  });
});

describe("compareToRecord", () => {
  it("marks the points record as achieved only at or above the target", () => {
    const record = getRecordById("most-points")!;
    expect(compareToRecord(seasonRecord({ points: 100 }), record).achieved).toBe(true);
    expect(compareToRecord(seasonRecord({ points: 99 }), record).achieved).toBe(false);
  });

  it("marks the unbeaten record as achieved only with zero losses", () => {
    const record = getRecordById("invincible")!;
    expect(compareToRecord(seasonRecord({ losses: 0 }), record).achieved).toBe(true);
    expect(compareToRecord(seasonRecord({ losses: 1 }), record).achieved).toBe(false);
  });

  it("treats fewer goals conceded as better (lowerIsBetter)", () => {
    const record = getRecordById("fewest-conceded")!;
    expect(compareToRecord(seasonRecord({ goalsConceded: 10 }), record).achieved).toBe(true);
    expect(compareToRecord(seasonRecord({ goalsConceded: 20 }), record).achieved).toBe(false);
  });

  it("marks the top-scorer record as achieved only at or above the target", () => {
    const record = getRecordById("top-scorer")!;
    expect(compareToRecord(seasonRecord({ topScorerGoals: 36 }), record).achieved).toBe(true);
    expect(compareToRecord(seasonRecord({ topScorerGoals: 35 }), record).achieved).toBe(false);
  });
});
