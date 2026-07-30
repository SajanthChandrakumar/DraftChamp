/**
 * Client-side eligibility helpers.
 *
 * These exist purely so tapping a card can highlight its open slots instantly,
 * without a round-trip. They work off the formation and position-family
 * definitions fetched from the API, so they can't drift from the server's own
 * rules — and the server re-validates every placement at simulate time anyway.
 */

export function eligibleFamilies(player, posToFam) {
  return new Set(player.positions.map((p) => posToFam[p]).filter(Boolean));
}

export function openSlotsFor(player, formation, filledSlots, posToFam) {
  const fams = eligibleFamilies(player, posToFam);
  return formation.slots.filter((slot) => fams.has(slot.fam) && !filledSlots[slot.id]);
}

export function isDraftComplete(filledSlots, formation) {
  return formation.slots.every((slot) => !!filledSlots[slot.id]);
}

export function hasUsablePick(players, formation, filledSlots, posToFam, remainingBudget) {
  return players.some((player) => {
    if (remainingBudget != null && (player.marketValue ?? 0) > remainingBudget) return false;
    return openSlotsFor(player, formation, filledSlots, posToFam).length > 0;
  });
}

export function pickRandomCombo(combos) {
  if (combos.length === 0) throw new Error("No club-seasons available");
  return combos[Math.floor(Math.random() * combos.length)];
}
