/**
 * Client-side eligibility helpers.
 *
 * These exist purely so tapping a card can highlight its open slots instantly,
 * without a round-trip. Matching is by exact position — a player is only
 * eligible for a slot whose label is one of their listed positions, e.g. an
 * RM cannot fill a CM slot. A handful of listed positions (CDM, CAM, LWB,
 * RWB, CF) have no formation slot of their own, so they alias onto the
 * nearest slot that plays the same role.
 */

const POSITION_ALIASES = {
  CDM: "CM",
  CAM: "CM",
  LWB: "LB",
  RWB: "RB",
  CF: "ST",
};

export function eligibleSlotLabels(player) {
  return new Set(player.positions.map((p) => POSITION_ALIASES[p] ?? p));
}

export function openSlotsFor(player, formation, filledSlots) {
  const labels = eligibleSlotLabels(player);
  return formation.slots.filter((slot) => labels.has(slot.label) && !filledSlots[slot.id]);
}

export function isDraftComplete(filledSlots, formation) {
  return formation.slots.every((slot) => !!filledSlots[slot.id]);
}

export function hasUsablePick(players, formation, filledSlots, remainingBudget) {
  return players.some((player) => {
    if (remainingBudget != null && (player.marketValue ?? 0) > remainingBudget) return false;
    return openSlotsFor(player, formation, filledSlots).length > 0;
  });
}

export function pickRandomCombo(combos) {
  if (combos.length === 0) throw new Error("No club-seasons available");
  return combos[Math.floor(Math.random() * combos.length)];
}
