import { describe, expect, it } from "vitest";
import { computeSquadStrength, simulateSeason } from "../../src/engine/simulation";
import { FORMATIONS, type SlotId } from "../../src/engine/formations";
import { seededRng } from "../../src/engine/rng";
import type { Player, Position } from "../../src/leagues/types";

function player(id: number, positions: Position[], overall: number): Player {
  return {
    id,
    name: `Player ${id}`,
    positions,
    overall,
    age: 25,
    attributes: {
      pace: overall,
      shooting: overall,
      passing: overall,
      dribbling: overall,
      defending: overall,
      physical: overall,
    },
  };
}

const POSITION_BY_FAMILY: Record<string, Position> = {
  GK: "GK",
  DEF: "CB",
  MID: "CM",
  FWD: "ST",
};

function buildXi(overall: number, outOfPosition = false): Record<SlotId, Player> {
  const filled: Record<SlotId, Player> = {};
  let id = 1;
  for (const slot of FORMATIONS["4-3-3"]) {
    // outOfPosition=true: every player is GK-only, so only the actual GK slot
    // stays "in family" and every DEF/MID/FWD slot takes the penalty.
    const position: Position = outOfPosition ? "GK" : POSITION_BY_FAMILY[slot.fam];
    filled[slot.id] = player(id++, [position], overall);
  }
  return filled;
}

describe("computeSquadStrength", () => {
  it("penalises an out-of-position XI relative to an identical in-position one", () => {
    const inPosition = buildXi(80, false);
    const outOfPosition = buildXi(80, true);
    expect(computeSquadStrength(outOfPosition, "4-3-3")).toBeLessThan(
      computeSquadStrength(inPosition, "4-3-3")
    );
  });
});

describe("simulateSeason", () => {
  it("is deterministic for the same XI", () => {
    const xi = buildXi(85);
    const a = simulateSeason(xi, "4-3-3");
    const b = simulateSeason(xi, "4-3-3");
    expect(a).toEqual(b);
  });

  it("always sums wins+draws+losses to a full 38-game season", () => {
    for (const overall of [40, 60, 75, 90, 99]) {
      const record = simulateSeason(buildXi(overall), "4-3-3");
      expect(record.wins + record.draws + record.losses).toBe(38);
      expect(record.points).toBe(record.wins * 3 + record.draws);
    }
  });

  it("produces plausible, non-negative goal figures alongside the record", () => {
    for (const overall of [40, 60, 75, 90, 99]) {
      const record = simulateSeason(buildXi(overall), "4-3-3");
      expect(record.goalsFor).toBeGreaterThan(0);
      expect(record.goalsConceded).toBeGreaterThan(0);
      expect(record.topScorerGoals).toBeGreaterThan(0);
      expect(record.topScorerGoals).toBeLessThanOrEqual(record.goalsFor);
    }
  });

  it("gives a stronger attack more goals-for than a weak one", () => {
    const strong = simulateSeason(buildXi(95), "4-3-3");
    const weak = simulateSeason(buildXi(45), "4-3-3");
    expect(strong.goalsFor).toBeGreaterThan(weak.goalsFor);
    expect(strong.goalsConceded).toBeLessThan(weak.goalsConceded);
  });

  it("reaches the near-perfect band only for a small fraction of a realistic squad-quality distribution", () => {
    // Real player pools have far more average players than world-class ones,
    // so skew the sampled overalls toward the lower end (squaring a uniform
    // draw) rather than sampling 40-99 uniformly.
    const rng = seededRng(12345);
    let topBandCount = 0;
    const samples = 500;
    for (let i = 0; i < samples; i++) {
      const overall = 40 + Math.floor(rng() ** 2 * 60);
      const record = simulateSeason(buildXi(overall), "4-3-3");
      if (record.tier === "Legendary") topBandCount++;
    }
    expect(topBandCount / samples).toBeLessThan(0.1);
  });
});
