import type { Player, PlayerId } from "../leagues/types";
import { FORMATIONS, eligibleFamilies, type FormationId, type SlotId } from "./formations";
import { hashString, seededRng } from "./rng";

export type Tier = "Legendary" | "Elite" | "Solid" | "Mid-table" | "Relegation Fight";

export interface SeasonRecord {
  wins: number;
  draws: number;
  losses: number;
  points: number;
  leaguePosition: number; // 1-20
  tier: Tier;
  topPlayerId: PlayerId;
  topScorerId: PlayerId;
  topScorerGoals: number;
  goalsFor: number;
  goalsConceded: number;
  narrative: string;
}

const GAMES_PER_SEASON = 38;
const LEAGUE_SIZE = 20;

interface AnchorRow {
  minStrength: number; // inclusive lower bound of squad strength band, 0-99 scale
  wins: number;
  draws: number;
  losses: number;
}

/** Ordered low-to-high; the highest row whose minStrength <= squad strength wins. */
const ANCHORS: AnchorRow[] = [
  { minStrength: 0, wins: 3, draws: 8, losses: 27 },
  { minStrength: 55, wins: 8, draws: 10, losses: 20 },
  { minStrength: 65, wins: 14, draws: 12, losses: 12 },
  { minStrength: 75, wins: 20, draws: 10, losses: 8 },
  { minStrength: 85, wins: 27, draws: 8, losses: 3 },
  { minStrength: 92, wins: 34, draws: 3, losses: 1 }, // near-38-0-0 band
];

/** Out-of-position placements are penalised, matching the reference game's draft tension. */
const OUT_OF_POSITION_FACTOR = 0.8;

export function computeSquadStrength(
  filledSlots: Record<SlotId, Player>,
  formationId: FormationId
): number {
  const slots = FORMATIONS[formationId];
  let total = 0;
  for (const slot of slots) {
    const player = filledSlots[slot.id];
    if (!player) continue;
    const inFamily = eligibleFamilies(player).has(slot.fam);
    total += inFamily ? player.overall : player.overall * OUT_OF_POSITION_FACTOR;
  }
  return total / slots.length;
}

/** Average overall of the back line + keeper — feeds the goals-conceded estimate. */
function computeDefenseStrength(filledSlots: Record<SlotId, Player>, formationId: FormationId): number {
  const slots = FORMATIONS[formationId].filter((s) => s.fam === "GK" || s.fam === "DEF");
  let total = 0;
  let count = 0;
  for (const slot of slots) {
    const player = filledSlots[slot.id];
    if (!player) continue;
    total += player.overall;
    count += 1;
  }
  return count > 0 ? total / count : 50;
}

/** Average overall of midfield + attack — feeds the goals-for estimate. */
function computeAttackStrength(filledSlots: Record<SlotId, Player>, formationId: FormationId): number {
  const slots = FORMATIONS[formationId].filter((s) => s.fam === "MID" || s.fam === "FWD");
  let total = 0;
  let count = 0;
  for (const slot of slots) {
    const player = filledSlots[slot.id];
    if (!player) continue;
    total += player.overall;
    count += 1;
  }
  return count > 0 ? total / count : 50;
}

/**
 * Goals-for/against are not simulated match-by-match — they're a second,
 * independent read of the same anchor-and-jitter philosophy applied to
 * attack/defense strength, so a Record Chase mode has something concrete
 * (goals scored, goals conceded) to compare against real PL records.
 */
function estimateGoals(strength: number, rng: () => number, direction: "for" | "against"): number {
  const base = direction === "for" ? 30 + (strength - 50) * 1.6 : 90 - (strength - 50) * 1.6;
  const jittered = base + (rng() * 10 - 5);
  return Math.max(10, Math.round(jittered));
}

function estimateTopScorerGoals(goalsFor: number, topScorer: Player, squadPlayers: Player[]): number {
  const attackers = squadPlayers.filter(
    (p) => eligibleFamilies(p).has("FWD") || eligibleFamilies(p).has("MID")
  );
  const pool = attackers.length > 0 ? attackers : squadPlayers;
  const totalShooting = pool.reduce((sum, p) => sum + p.attributes.shooting, 0) || 1;
  const share = Math.min(0.6, (topScorer.attributes.shooting / totalShooting) * 1.8);
  return Math.max(1, Math.round(goalsFor * share));
}

function pickAnchor(strength: number): AnchorRow {
  let chosen = ANCHORS[0];
  for (const row of ANCHORS) {
    if (strength >= row.minStrength) chosen = row;
  }
  return chosen;
}

function pointsToPosition(points: number): number {
  const maxPoints = GAMES_PER_SEASON * 3;
  const ratio = 1 - Math.min(1, Math.max(0, points / maxPoints));
  const position = Math.round(1 + ratio * (LEAGUE_SIZE - 1));
  return Math.min(LEAGUE_SIZE, Math.max(1, position));
}

function pointsToTier(points: number): Tier {
  if (points >= 95) return "Legendary";
  if (points >= 75) return "Elite";
  if (points >= 55) return "Solid";
  if (points >= 40) return "Mid-table";
  return "Relegation Fight";
}

function buildNarrative(tier: Tier, wins: number, draws: number, losses: number): string {
  switch (tier) {
    case "Legendary":
      return `An unbelievable campaign: ${wins}W ${draws}D ${losses}L. This XI belongs in the history books.`;
    case "Elite":
      return `A title-challenging season — ${wins}W ${draws}D ${losses}L puts this squad among the league's very best.`;
    case "Solid":
      return `A respectable European-chasing season: ${wins}W ${draws}D ${losses}L.`;
    case "Mid-table":
      return `A steady, unspectacular mid-table finish: ${wins}W ${draws}D ${losses}L.`;
    case "Relegation Fight":
      return `A season to forget — ${wins}W ${draws}D ${losses}L left this XI fighting the drop.`;
  }
}

function topByOverall(players: Player[]): Player {
  return players.reduce((a, b) => (b.overall > a.overall ? b : a));
}

function topScorerAmong(players: Player[]): Player {
  const forwards = players.filter((p) => eligibleFamilies(p).has("FWD"));
  const pool = forwards.length > 0 ? forwards : players;
  return pool.reduce((a, b) => (b.attributes.shooting > a.attributes.shooting ? b : a));
}

/**
 * Deterministic scoring function, not a match engine: squad strength maps to an
 * anchor W-D-L band, then bounded jitter (seeded from the XI itself) nudges the
 * result so the same XI always reproduces the same SeasonRecord — required for
 * a shareable result.
 */
export function simulateSeason(
  filledSlots: Record<SlotId, Player>,
  formationId: FormationId
): SeasonRecord {
  const strength = computeSquadStrength(filledSlots, formationId);
  const anchor = pickAnchor(strength);

  const xiFingerprint = FORMATIONS[formationId]
    .map((slot) => filledSlots[slot.id]?.id ?? "x")
    .join(",");
  const rng = seededRng(hashString(xiFingerprint));

  const jitter = Math.floor(rng() * 5) - 2; // -2..+2
  const wins = Math.max(0, Math.min(GAMES_PER_SEASON, anchor.wins + jitter));
  const losses = Math.max(0, Math.min(GAMES_PER_SEASON - wins, anchor.losses - jitter));
  const draws = GAMES_PER_SEASON - wins - losses;

  const points = wins * 3 + draws;
  const leaguePosition = pointsToPosition(points);
  const tier = pointsToTier(points);

  const squadPlayers = Object.values(filledSlots);
  const topPlayerId = topByOverall(squadPlayers).id;
  const topScorer = topScorerAmong(squadPlayers);
  const narrative = buildNarrative(tier, wins, draws, losses);

  const attackStrength = computeAttackStrength(filledSlots, formationId);
  const defenseStrength = computeDefenseStrength(filledSlots, formationId);
  const goalsFor = estimateGoals(attackStrength, rng, "for");
  const goalsConceded = estimateGoals(defenseStrength, rng, "against");
  const topScorerGoals = estimateTopScorerGoals(goalsFor, topScorer, squadPlayers);

  return {
    wins,
    draws,
    losses,
    points,
    leaguePosition,
    tier,
    topPlayerId,
    topScorerId: topScorer.id,
    topScorerGoals,
    goalsFor,
    goalsConceded,
    narrative,
  };
}
