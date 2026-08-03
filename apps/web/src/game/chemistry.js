/**
 * Client-side mirror of the server's chemistry scoring (app/engine/chemistry.py)
 * — used only to show a live meter while drafting. The server recomputes it
 * authoritatively from its own data at simulate time; this exists purely for
 * instant feedback on a tap, before the real result ever comes back.
 */

const TEAMMATE_WEIGHT = 3;
const CLUBMATE_WEIGHT = 1.5;
const COUNTRYMAN_WEIGHT = 1;

function classifyPair(a, b) {
  if (a.team === b.team && a.season === b.season) return "teammates";
  if (a.team === b.team) return "clubmates";
  if (a.player.nationality === b.player.nationality) return "countrymen";
  return null;
}

const WEIGHT_BY_KIND = {
  teammates: TEAMMATE_WEIGHT,
  clubmates: CLUBMATE_WEIGHT,
  countrymen: COUNTRYMAN_WEIGHT,
};

/** entries: array of { player, team, season } — same shape as a draftContext
 * `filled` entry's value. */
export function computeChemistryScore(entries) {
  if (entries.length < 2) return 0;

  let raw = 0;
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const kind = classifyPair(entries[i], entries[j]);
      if (kind) raw += WEIGHT_BY_KIND[kind];
    }
  }

  const totalPairs = (entries.length * (entries.length - 1)) / 2;
  const maxRaw = totalPairs * TEAMMATE_WEIGHT;
  return maxRaw > 0 ? Math.min(100, Math.round((100 * raw) / maxRaw)) : 0;
}
