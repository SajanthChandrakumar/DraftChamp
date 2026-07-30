// TEST FIXTURE ONLY — synthetic data for unit tests and the dev-only
// `?fixture=test` click-through flag. Not real player data, never shipped
// as user-facing content.
import type { LeagueData, Player, Position } from "../../src/leagues/types";

function makePlayer(
  id: number,
  name: string,
  positions: Position[],
  overall: number
): Player {
  return {
    id,
    name,
    positions,
    overall,
    age: 24,
    shirtNumber: id % 99,
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

function makeSquad(startId: number, overallBase: number): Player[] {
  const specs: [Position[], string][] = [
    [["GK"], "Keeper"],
    [["CB"], "Center Back A"],
    [["CB"], "Center Back B"],
    [["LB"], "Left Back"],
    [["RB"], "Right Back"],
    [["CB"], "Sweeper"],
    [["CM"], "Midfielder A"],
    [["CM"], "Midfielder B"],
    [["CDM"], "Holding Mid"],
    [["LM"], "Left Mid"],
    [["RM"], "Right Mid"],
    [["ST"], "Striker A"],
    [["ST"], "Striker B"],
    [["LW"], "Winger"],
  ];
  return specs.map(([positions, label], i) =>
    makePlayer(startId + i, `${label} #${startId + i}`, positions, overallBase + (i % 5))
  );
}

const TEAM_A_2023 = makeSquad(1, 70);
const TEAM_B_2024 = makeSquad(100, 78);
const TEAM_C_2023 = makeSquad(200, 60);

export const TEST_LEAGUE_FIXTURE: LeagueData = {
  id: "test-fixture",
  displayName: "Test Fixture League",
  teams: {
    TMA: { code: "TMA", name: "Test Town A" },
    TMB: { code: "TMB", name: "Test Town B" },
    TMC: { code: "TMC", name: "Test Town C" },
  },
  years: [2023, 2024],
  combos: [
    ["TMA", 2023],
    ["TMB", 2024],
    ["TMC", 2023],
  ],
  squads: {
    "TMA|2023": TEAM_A_2023,
    "TMB|2024": TEAM_B_2024,
    "TMC|2023": TEAM_C_2023,
  },
  dataVersion: "test-fixture-1",
};
