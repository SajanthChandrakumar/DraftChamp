"""Formation layouts and position-family eligibility.

Slot order within each formation is load-bearing: `simulation.simulate_season`
builds its determinism fingerprint by walking slots in this order, so
reordering a formation's slots changes every result for that formation.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.models import Player, Position, PositionFamily


@dataclass(frozen=True)
class FormationSlot:
    id: str
    label: str
    fam: PositionFamily
    x: float
    y: float


FORMATIONS: dict[str, list[FormationSlot]] = {
    "4-3-3": [
        FormationSlot("gk", "GK", "GK", 50, 92),
        FormationSlot("lb", "LB", "DEF", 15, 74),
        FormationSlot("cb1", "CB", "DEF", 38, 78),
        FormationSlot("cb2", "CB", "DEF", 62, 78),
        FormationSlot("rb", "RB", "DEF", 85, 74),
        FormationSlot("cm1", "CM", "MID", 30, 52),
        FormationSlot("cm2", "CM", "MID", 50, 46),
        FormationSlot("cm3", "CM", "MID", 70, 52),
        FormationSlot("lw", "LW", "FWD", 18, 22),
        FormationSlot("st", "ST", "FWD", 50, 14),
        FormationSlot("rw", "RW", "FWD", 82, 22),
    ],
    "4-4-2": [
        FormationSlot("gk", "GK", "GK", 50, 92),
        FormationSlot("lb", "LB", "DEF", 15, 74),
        FormationSlot("cb1", "CB", "DEF", 38, 78),
        FormationSlot("cb2", "CB", "DEF", 62, 78),
        FormationSlot("rb", "RB", "DEF", 85, 74),
        FormationSlot("lm", "LM", "MID", 15, 48),
        FormationSlot("cm1", "CM", "MID", 38, 50),
        FormationSlot("cm2", "CM", "MID", 62, 50),
        FormationSlot("rm", "RM", "MID", 85, 48),
        FormationSlot("st1", "ST", "FWD", 38, 16),
        FormationSlot("st2", "ST", "FWD", 62, 16),
    ],
    "3-5-2": [
        FormationSlot("gk", "GK", "GK", 50, 92),
        FormationSlot("cb1", "CB", "DEF", 30, 78),
        FormationSlot("cb2", "CB", "DEF", 50, 80),
        FormationSlot("cb3", "CB", "DEF", 70, 78),
        FormationSlot("lm", "LM", "MID", 10, 50),
        FormationSlot("cm1", "CM", "MID", 32, 54),
        FormationSlot("cm2", "CM", "MID", 50, 48),
        FormationSlot("cm3", "CM", "MID", 68, 54),
        FormationSlot("rm", "RM", "MID", 90, 50),
        FormationSlot("st1", "ST", "FWD", 38, 16),
        FormationSlot("st2", "ST", "FWD", 62, 16),
    ],
    "4-2-3-1": [
        FormationSlot("gk", "GK", "GK", 50, 92),
        FormationSlot("lb", "LB", "DEF", 15, 74),
        FormationSlot("cb1", "CB", "DEF", 38, 78),
        FormationSlot("cb2", "CB", "DEF", 62, 78),
        FormationSlot("rb", "RB", "DEF", 85, 74),
        FormationSlot("cm1", "CM", "MID", 35, 58),
        FormationSlot("cm2", "CM", "MID", 65, 58),
        FormationSlot("lw", "LW", "FWD", 18, 34),
        FormationSlot("cm3", "CM", "MID", 50, 32),
        FormationSlot("rw", "RW", "FWD", 82, 34),
        FormationSlot("st", "ST", "FWD", 50, 14),
    ],
    "4-1-4-1": [
        FormationSlot("gk", "GK", "GK", 50, 92),
        FormationSlot("lb", "LB", "DEF", 15, 74),
        FormationSlot("cb1", "CB", "DEF", 38, 78),
        FormationSlot("cb2", "CB", "DEF", 62, 78),
        FormationSlot("rb", "RB", "DEF", 85, 74),
        FormationSlot("cm1", "CM", "MID", 50, 60),
        FormationSlot("lm", "LM", "MID", 15, 46),
        FormationSlot("cm2", "CM", "MID", 38, 44),
        FormationSlot("cm3", "CM", "MID", 62, 44),
        FormationSlot("rm", "RM", "MID", 85, 46),
        FormationSlot("st", "ST", "FWD", 50, 14),
    ],
    "5-3-2": [
        FormationSlot("gk", "GK", "GK", 50, 92),
        FormationSlot("lb", "LB", "DEF", 10, 66),
        FormationSlot("cb1", "CB", "DEF", 30, 80),
        FormationSlot("cb2", "CB", "DEF", 50, 82),
        FormationSlot("cb3", "CB", "DEF", 70, 80),
        FormationSlot("rb", "RB", "DEF", 90, 66),
        FormationSlot("cm1", "CM", "MID", 30, 50),
        FormationSlot("cm2", "CM", "MID", 50, 46),
        FormationSlot("cm3", "CM", "MID", 70, 50),
        FormationSlot("st1", "ST", "FWD", 38, 16),
        FormationSlot("st2", "ST", "FWD", 62, 16),
    ],
    "3-4-3": [
        FormationSlot("gk", "GK", "GK", 50, 92),
        FormationSlot("cb1", "CB", "DEF", 30, 78),
        FormationSlot("cb2", "CB", "DEF", 50, 80),
        FormationSlot("cb3", "CB", "DEF", 70, 78),
        FormationSlot("lm", "LM", "MID", 12, 50),
        FormationSlot("cm1", "CM", "MID", 35, 52),
        FormationSlot("cm2", "CM", "MID", 65, 52),
        FormationSlot("rm", "RM", "MID", 88, 50),
        FormationSlot("lw", "LW", "FWD", 18, 20),
        FormationSlot("st", "ST", "FWD", 50, 14),
        FormationSlot("rw", "RW", "FWD", 82, 20),
    ],
    "5-4-1": [
        FormationSlot("gk", "GK", "GK", 50, 92),
        FormationSlot("lb", "LB", "DEF", 10, 66),
        FormationSlot("cb1", "CB", "DEF", 30, 80),
        FormationSlot("cb2", "CB", "DEF", 50, 82),
        FormationSlot("cb3", "CB", "DEF", 70, 80),
        FormationSlot("rb", "RB", "DEF", 90, 66),
        FormationSlot("lm", "LM", "MID", 15, 46),
        FormationSlot("cm1", "CM", "MID", 38, 48),
        FormationSlot("cm2", "CM", "MID", 62, 48),
        FormationSlot("rm", "RM", "MID", 85, 46),
        FormationSlot("st", "ST", "FWD", 50, 14),
    ],
    "4-5-1": [
        FormationSlot("gk", "GK", "GK", 50, 92),
        FormationSlot("lb", "LB", "DEF", 15, 74),
        FormationSlot("cb1", "CB", "DEF", 38, 78),
        FormationSlot("cb2", "CB", "DEF", 62, 78),
        FormationSlot("rb", "RB", "DEF", 85, 74),
        FormationSlot("lm", "LM", "MID", 12, 50),
        FormationSlot("cm1", "CM", "MID", 32, 52),
        FormationSlot("cm2", "CM", "MID", 50, 48),
        FormationSlot("cm3", "CM", "MID", 68, 52),
        FormationSlot("rm", "RM", "MID", 88, 50),
        FormationSlot("st", "ST", "FWD", 50, 14),
    ],
}

POS_TO_FAM: dict[Position, PositionFamily] = {
    "GK": "GK",
    "CB": "DEF",
    "LB": "DEF",
    "RB": "DEF",
    "LWB": "DEF",
    "RWB": "DEF",
    "CDM": "MID",
    "CM": "MID",
    "CAM": "MID",
    "LM": "MID",
    "RM": "MID",
    "LW": "FWD",
    "RW": "FWD",
    "ST": "FWD",
    "CF": "FWD",
}


def eligible_families(player: Player) -> set[PositionFamily]:
    return {POS_TO_FAM[pos] for pos in player.positions if pos in POS_TO_FAM}


def open_slots_for(
    player: Player, formation_id: str, filled_slots: dict[str, Player]
) -> list[FormationSlot]:
    fams = eligible_families(player)
    return [
        slot
        for slot in FORMATIONS[formation_id]
        if slot.fam in fams and slot.id not in filled_slots
    ]


def is_draft_complete(filled_slots: dict[str, Player], formation_id: str) -> bool:
    return all(slot.id in filled_slots for slot in FORMATIONS[formation_id])
