import { describe, expect, it } from "vitest";
import { availablePlayers, pickCombo, resolveSquad } from "../../src/engine/draft";
import { TEST_LEAGUE_FIXTURE } from "../fixtures/test-league";
import type { Combo } from "../../src/leagues/types";

describe("pickCombo", () => {
  it("selects the combo at the index the rng implies", () => {
    const combos: Combo[] = [["A", 2020], ["B", 2021], ["C", 2022]];
    expect(pickCombo(combos, () => 0)).toEqual(["A", 2020]);
    expect(pickCombo(combos, () => 0.99)).toEqual(["C", 2022]);
  });

  it("throws when there are no combos to pick from", () => {
    expect(() => pickCombo([], () => 0)).toThrow();
  });
});

describe("resolveSquad", () => {
  it("returns the squad for a known combo", () => {
    const squad = resolveSquad(TEST_LEAGUE_FIXTURE, ["TMA", 2023]);
    expect(squad.length).toBeGreaterThan(0);
  });

  it("returns an empty array for an unknown combo rather than throwing", () => {
    expect(resolveSquad(TEST_LEAGUE_FIXTURE, ["ZZZ", 1900])).toEqual([]);
  });
});

describe("availablePlayers", () => {
  it("excludes already-used player ids", () => {
    const squad = resolveSquad(TEST_LEAGUE_FIXTURE, ["TMA", 2023]);
    const used = new Set([squad[0].id]);
    const available = availablePlayers(squad, used);
    expect(available.find((p) => p.id === squad[0].id)).toBeUndefined();
    expect(available.length).toBe(squad.length - 1);
  });
});
