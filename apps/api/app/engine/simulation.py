"""Season simulation.

Deliberately not a match engine: squad strength maps to an anchor W-D-L band,
then bounded jitter seeded from the XI itself nudges the result, so the same
XI always reproduces the same season — required for a shareable result.

Ported from the original TypeScript engine. Two JS semantics are reproduced
explicitly: `Math.round` rounds half toward +Infinity (Python's built-in
`round` uses banker's rounding), and the RNG is consumed in a fixed order
(jitter, then goals-for, then goals-conceded) which must not be reordered.
"""

from __future__ import annotations

import math
from collections.abc import Callable
from dataclasses import dataclass

from app.engine.formations import FORMATIONS, eligible_families
from app.engine.rng import hash_string, seeded_rng
from app.models import Player

GAMES_PER_SEASON = 38
LEAGUE_SIZE = 20

# Out-of-position placements are penalised, which is what makes the draft a
# real decision rather than "always take the highest overall".
OUT_OF_POSITION_FACTOR = 0.8


def js_round(value: float) -> int:
    """JavaScript's Math.round: halves go toward +Infinity."""
    return math.floor(value + 0.5)


@dataclass(frozen=True)
class AnchorRow:
    min_strength: float
    wins: int
    draws: int
    losses: int


# Ordered low-to-high; the highest row whose min_strength <= squad strength wins.
ANCHORS: list[AnchorRow] = [
    AnchorRow(0, 3, 8, 27),
    AnchorRow(55, 8, 10, 20),
    AnchorRow(65, 14, 12, 12),
    AnchorRow(75, 20, 10, 8),
    AnchorRow(85, 27, 8, 3),
    AnchorRow(92, 34, 3, 1),  # near-38-0-0 band
]


@dataclass
class SeasonRecord:
    wins: int
    draws: int
    losses: int
    points: int
    league_position: int
    tier: str
    top_player_id: int
    top_player_name: str
    top_scorer_id: int
    top_scorer_name: str
    top_scorer_goals: int
    goals_for: int
    goals_conceded: int
    squad_strength: float
    narrative: str


def compute_squad_strength(filled_slots: dict[str, Player], formation_id: str) -> float:
    slots = FORMATIONS[formation_id]
    total = 0.0
    for slot in slots:
        player = filled_slots.get(slot.id)
        if player is None:
            continue
        in_family = slot.fam in eligible_families(player)
        total += player.overall if in_family else player.overall * OUT_OF_POSITION_FACTOR
    return total / len(slots)


def _strength_of_families(
    filled_slots: dict[str, Player], formation_id: str, families: set[str]
) -> float:
    total = 0
    count = 0
    for slot in FORMATIONS[formation_id]:
        if slot.fam not in families:
            continue
        player = filled_slots.get(slot.id)
        if player is None:
            continue
        total += player.overall
        count += 1
    return total / count if count > 0 else 50.0


def _estimate_goals(strength: float, rng: Callable[[], float], direction: str) -> int:
    base = 30 + (strength - 50) * 1.6 if direction == "for" else 90 - (strength - 50) * 1.6
    jittered = base + (rng() * 10 - 5)
    return max(10, js_round(jittered))


def _estimate_top_scorer_goals(
    goals_for: int, top_scorer: Player, squad_players: list[Player]
) -> int:
    attackers = [
        p for p in squad_players if eligible_families(p) & {"FWD", "MID"}
    ]
    pool = attackers if attackers else squad_players
    total_shooting = sum(p.attributes.shooting for p in pool) or 1
    share = min(0.6, (top_scorer.attributes.shooting / total_shooting) * 1.8)
    return max(1, js_round(goals_for * share))


def _pick_anchor(strength: float) -> AnchorRow:
    chosen = ANCHORS[0]
    for row in ANCHORS:
        if strength >= row.min_strength:
            chosen = row
    return chosen


def _points_to_position(points: int) -> int:
    max_points = GAMES_PER_SEASON * 3
    ratio = 1 - min(1.0, max(0.0, points / max_points))
    position = js_round(1 + ratio * (LEAGUE_SIZE - 1))
    return min(LEAGUE_SIZE, max(1, position))


def _points_to_tier(points: int) -> str:
    if points >= 95:
        return "Legendary"
    if points >= 75:
        return "Elite"
    if points >= 55:
        return "Solid"
    if points >= 40:
        return "Mid-table"
    return "Relegation Fight"


def _build_narrative(tier: str, wins: int, draws: int, losses: int) -> str:
    record = f"{wins}W {draws}D {losses}L"
    if tier == "Legendary":
        return f"An unbelievable campaign: {record}. This XI belongs in the history books."
    if tier == "Elite":
        return (
            f"A title-challenging season — {record} puts this squad among "
            "the league's very best."
        )
    if tier == "Solid":
        return f"A respectable European-chasing season: {record}."
    if tier == "Mid-table":
        return f"A steady, unspectacular mid-table finish: {record}."
    return f"A season to forget — {record} left this XI fighting the drop."


def _top_by_overall(players: list[Player]) -> Player:
    best = players[0]
    for player in players[1:]:
        if player.overall > best.overall:
            best = player
    return best


def _top_scorer_among(players: list[Player]) -> Player:
    forwards = [p for p in players if "FWD" in eligible_families(p)]
    pool = forwards if forwards else players
    best = pool[0]
    for player in pool[1:]:
        if player.attributes.shooting > best.attributes.shooting:
            best = player
    return best


def simulate_season(filled_slots: dict[str, Player], formation_id: str) -> SeasonRecord:
    strength = compute_squad_strength(filled_slots, formation_id)
    anchor = _pick_anchor(strength)

    fingerprint = ",".join(
        str(filled_slots[slot.id].id) if slot.id in filled_slots else "x"
        for slot in FORMATIONS[formation_id]
    )
    rng = seeded_rng(hash_string(fingerprint))

    jitter = math.floor(rng() * 5) - 2  # -2..+2
    wins = max(0, min(GAMES_PER_SEASON, anchor.wins + jitter))
    losses = max(0, min(GAMES_PER_SEASON - wins, anchor.losses - jitter))
    draws = GAMES_PER_SEASON - wins - losses

    points = wins * 3 + draws
    league_position = _points_to_position(points)
    tier = _points_to_tier(points)

    # Walk slots in formation order so the result never depends on the order
    # the client happened to send its assignments in.
    squad_players = [
        filled_slots[slot.id] for slot in FORMATIONS[formation_id] if slot.id in filled_slots
    ]
    top_player = _top_by_overall(squad_players)
    top_scorer = _top_scorer_among(squad_players)
    narrative = _build_narrative(tier, wins, draws, losses)

    attack_strength = _strength_of_families(filled_slots, formation_id, {"MID", "FWD"})
    defense_strength = _strength_of_families(filled_slots, formation_id, {"GK", "DEF"})
    goals_for = _estimate_goals(attack_strength, rng, "for")
    goals_conceded = _estimate_goals(defense_strength, rng, "against")
    top_scorer_goals = _estimate_top_scorer_goals(goals_for, top_scorer, squad_players)

    return SeasonRecord(
        wins=wins,
        draws=draws,
        losses=losses,
        points=points,
        league_position=league_position,
        tier=tier,
        top_player_id=top_player.id,
        top_player_name=top_player.name,
        top_scorer_id=top_scorer.id,
        top_scorer_name=top_scorer.name,
        top_scorer_goals=top_scorer_goals,
        goals_for=goals_for,
        goals_conceded=goals_conceded,
        squad_strength=strength,
        narrative=narrative,
    )
