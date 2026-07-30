import type { Combo, LeagueData, Player, PlayerId } from "../leagues/types";
import { squadKey } from "../leagues/types";

// v1 allows combo repeats within a session: with a small initial combo pool,
// excluding used combos risks running out before all 11 rounds are filled.
// Revisit once the real dataset is large (272+ combos in the reference app).
export function pickCombo(combos: Combo[], rng: () => number): Combo {
  if (combos.length === 0) throw new Error("No combos available in league data");
  const idx = Math.floor(rng() * combos.length);
  return combos[idx];
}

export function resolveSquad(leagueData: LeagueData, combo: Combo): Player[] {
  return leagueData.squads[squadKey(combo)] ?? [];
}

/** Players in this spin's squad not yet drafted this session. */
export function availablePlayers(
  squad: Player[],
  usedPlayerIds: Set<PlayerId>
): Player[] {
  return squad.filter((p) => !usedPlayerIds.has(p.id));
}

export { eligibleFamilies, openSlotsFor, isDraftComplete } from "./formations";
