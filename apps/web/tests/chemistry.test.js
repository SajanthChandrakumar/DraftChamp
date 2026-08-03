import { describe, expect, it } from "vitest";
import { computeChemistryScore } from "../src/game/chemistry";
import { player } from "./fixtures";

function entry(id, team, season, nationality = "England") {
  return { player: { ...player(id), nationality }, team, season };
}

describe("computeChemistryScore", () => {
  it("is 0 for fewer than two players", () => {
    expect(computeChemistryScore([])).toBe(0);
    expect(computeChemistryScore([entry(1, "ARS", 2020)])).toBe(0);
  });

  it("scores higher for teammates than clubmates than countrymen", () => {
    const teammates = computeChemistryScore([entry(1, "ARS", 2020), entry(2, "ARS", 2020)]);
    const clubmates = computeChemistryScore([entry(1, "ARS", 2020), entry(2, "ARS", 2021)]);
    const countrymen = computeChemistryScore([
      entry(1, "ARS", 2020, "France"),
      entry(2, "CHE", 2020, "France"),
    ]);
    expect(teammates).toBeGreaterThan(clubmates);
    expect(clubmates).toBeGreaterThan(countrymen);
    expect(countrymen).toBeGreaterThan(0);
  });

  it("is 0 when nothing links any pair", () => {
    const score = computeChemistryScore([
      entry(1, "ARS", 2020, "France"),
      entry(2, "CHE", 2021, "Spain"),
      entry(3, "MCI", 2019, "Brazil"),
    ]);
    expect(score).toBe(0);
  });

  it("reaches 100 for an all-teammates XI", () => {
    const entries = Array.from({ length: 11 }, (_, i) => entry(i, "ARS", 2020));
    expect(computeChemistryScore(entries)).toBe(100);
  });

  it("does not depend on entry order", () => {
    const entries = [
      entry(1, "ARS", 2020),
      entry(2, "ARS", 2020),
      entry(3, "CHE", 2021, "France"),
    ];
    expect(computeChemistryScore(entries)).toBe(computeChemistryScore([...entries].reverse()));
  });

  it("stays within 0-100 for a large realistic XI", () => {
    const entries = Array.from({ length: 11 }, (_, i) =>
      entry(i, i % 2 === 0 ? "ARS" : "CHE", 2015 + (i % 4), i % 3 === 0 ? "England" : "France")
    );
    const score = computeChemistryScore(entries);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
