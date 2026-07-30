const GROUP_FAMILIES = {
  overall: null, // every filled slot counts
  attack: new Set(["MID", "FWD"]),
  defense: new Set(["GK", "DEF"]),
};

/** Average overall of whatever's filled so far, grouped the same way the
 * server groups slots for its win/goals-for/goals-against formulas. Slots
 * that are still empty just don't count yet — this is a live read of your
 * picks, not a prediction of the finished XI. */
export function computeDraftStrength(filled, formation) {
  const result = { overall: 0, attack: 0, defense: 0 };
  if (!formation) return result;

  for (const group of Object.keys(GROUP_FAMILIES)) {
    const families = GROUP_FAMILIES[group];
    let total = 0;
    let count = 0;
    for (const slot of formation.slots) {
      const entry = filled[slot.id];
      if (!entry) continue;
      if (families && !families.has(slot.fam)) continue;
      total += entry.player.overall;
      count += 1;
    }
    result[group] = count > 0 ? total / count : 0;
  }
  return result;
}
