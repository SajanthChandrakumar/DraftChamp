/**
 * Client-side eligibility helpers.
 *
 * These exist purely so tapping a card can highlight its open slots instantly,
 * without a round-trip. They work off the formation and position-family
 * definitions fetched from the API, so they can't drift from the server's own
 * rules — and the server re-validates every placement at simulate time anyway.
 */

import type { Formation, FormationSlot, Player, Position, PositionFamily } from "../api/types";

export type PositionFamilyMap = Record<Position, PositionFamily>;

export function eligibleFamilies(
  player: Player,
  posToFam: PositionFamilyMap
): Set<PositionFamily> {
  return new Set(player.positions.map((p) => posToFam[p]).filter(Boolean));
}

export function openSlotsFor(
  player: Player,
  formation: Formation,
  filledSlots: Record<string, Player>,
  posToFam: PositionFamilyMap
): FormationSlot[] {
  const fams = eligibleFamilies(player, posToFam);
  return formation.slots.filter((slot) => fams.has(slot.fam) && !filledSlots[slot.id]);
}

export function isDraftComplete(
  filledSlots: Record<string, Player>,
  formation: Formation
): boolean {
  return formation.slots.every((slot) => !!filledSlots[slot.id]);
}

export function hasUsablePick(
  players: Player[],
  formation: Formation,
  filledSlots: Record<string, Player>,
  posToFam: PositionFamilyMap,
  remainingBudget: number | null
): boolean {
  return players.some((player) => {
    if (remainingBudget != null && (player.marketValue ?? 0) > remainingBudget) return false;
    return openSlotsFor(player, formation, filledSlots, posToFam).length > 0;
  });
}

export function pickRandomCombo<T>(combos: T[]): T {
  if (combos.length === 0) throw new Error("No club-seasons available");
  return combos[Math.floor(Math.random() * combos.length)];
}
