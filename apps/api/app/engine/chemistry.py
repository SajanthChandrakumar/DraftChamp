"""Squad chemistry — how much of the drafted XI is *actually* connected.

Deliberately not FIFA/FUT's chemistry (nationality/league/club counters that
mostly reward stacking the same three leagues). Every link here is a fact
about the real season data the squad was drafted from:

- teammates:  two players drafted from the same club *and* season really did
              play together that year.
- clubmates:  two players wore the same club's shirt, just in different eras.
- countrymen: two players share a nationality — the weakest link, but still a
              real, checkable fact rather than an invented stat.

This is purely informational. It does not feed into the season simulation —
that engine's anchor table is calibrated against real squad strength, and
folding chemistry into it would need a fresh, unverified recalibration for no
clear gameplay benefit. Chemistry is its own signal, shown alongside the
result rather than baked into it.
"""

from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations
from typing import Literal, NamedTuple

from app.models import Player

# Weights are ordered by how strong a real link each represents. The scale
# denominator (see `compute_chemistry`) is chosen so that only a genuinely
# all-teammates XI (eleven players from one single club-season) reaches 100 —
# everything short of that is a partial, honestly-reported score.
TEAMMATE_WEIGHT = 3.0
CLUBMATE_WEIGHT = 1.5
COUNTRYMAN_WEIGHT = 1.0

ChemistryLinkKind = Literal["teammates", "clubmates", "countrymen"]


class DraftedPlayer(NamedTuple):
    slot_id: str
    player: Player
    team: str
    season: int


@dataclass(frozen=True)
class ChemistryLink:
    kind: ChemistryLinkKind
    slot_a: str
    slot_b: str
    player_a_name: str
    player_b_name: str
    detail: str


@dataclass(frozen=True)
class ChemistryResult:
    score: int
    teammate_pairs: int
    clubmate_pairs: int
    countryman_pairs: int
    highlights: list[ChemistryLink]


def _season_label(year: int) -> str:
    return f"{year}-{str(year + 1)[-2:]}"


def _classify_pair(a: DraftedPlayer, b: DraftedPlayer) -> ChemistryLink | None:
    if a.team == b.team and a.season == b.season:
        return ChemistryLink(
            kind="teammates",
            slot_a=a.slot_id,
            slot_b=b.slot_id,
            player_a_name=a.player.name,
            player_b_name=b.player.name,
            detail=f"{a.team} teammates, {_season_label(a.season)}",
        )
    if a.team == b.team:
        seasons = sorted({a.season, b.season})
        detail = " & ".join(_season_label(s) for s in seasons)
        return ChemistryLink(
            kind="clubmates",
            slot_a=a.slot_id,
            slot_b=b.slot_id,
            player_a_name=a.player.name,
            player_b_name=b.player.name,
            detail=f"Both wore the {a.team} shirt ({detail})",
        )
    if a.player.nationality == b.player.nationality:
        return ChemistryLink(
            kind="countrymen",
            slot_a=a.slot_id,
            slot_b=b.slot_id,
            player_a_name=a.player.name,
            player_b_name=b.player.name,
            detail=f"Both {a.player.nationality}",
        )
    return None


# The maximum any pair can contribute; used to scale the raw pairwise total
# into a 0-100 score. A real all-teammates XI (11 players, one club-season)
# hits every pair at the top weight and lands at exactly 100.
_MAX_PAIR_WEIGHT = TEAMMATE_WEIGHT
_LINK_WEIGHT: dict[ChemistryLinkKind, float] = {
    "teammates": TEAMMATE_WEIGHT,
    "clubmates": CLUBMATE_WEIGHT,
    "countrymen": COUNTRYMAN_WEIGHT,
}
_HIGHLIGHT_ORDER: dict[ChemistryLinkKind, int] = {
    "teammates": 0,
    "clubmates": 1,
    "countrymen": 2,
}
MAX_HIGHLIGHTS = 5


def compute_chemistry(entries: list[DraftedPlayer]) -> ChemistryResult:
    if len(entries) < 2:
        return ChemistryResult(score=0, teammate_pairs=0, clubmate_pairs=0, countryman_pairs=0, highlights=[])

    links: list[ChemistryLink] = []
    for a, b in combinations(entries, 2):
        link = _classify_pair(a, b)
        if link is not None:
            links.append(link)

    total_pairs = len(entries) * (len(entries) - 1) // 2
    raw = sum(_LINK_WEIGHT[link.kind] for link in links)
    max_raw = total_pairs * _MAX_PAIR_WEIGHT
    score = round(100 * raw / max_raw) if max_raw > 0 else 0

    links.sort(key=lambda link: _HIGHLIGHT_ORDER[link.kind])

    return ChemistryResult(
        score=min(100, score),
        teammate_pairs=sum(1 for link in links if link.kind == "teammates"),
        clubmate_pairs=sum(1 for link in links if link.kind == "clubmates"),
        countryman_pairs=sum(1 for link in links if link.kind == "countrymen"),
        highlights=links[:MAX_HIGHLIGHTS],
    )
