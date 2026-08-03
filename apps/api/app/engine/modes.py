"""Draft-rule variants.

These are chosen *before* the draft because each one constrains what you're
allowed to draft. Records/challenges deliberately are not in this list — they
are evaluated after the fact against every completed XI (see engine.records).
"""

from __future__ import annotations

from dataclasses import dataclass

DEFAULT_BUDGET_CAP = 900_000_000


@dataclass(frozen=True)
class GameModeInfo:
    id: str
    label: str
    description: str
    needs_club: bool = False
    has_budget: bool = False


GAME_MODES: list[GameModeInfo] = [
    GameModeInfo(
        id="daily",
        label="Daily Draft",
        description="One shared puzzle a day — same formation, same reveals for everyone.",
    ),
    GameModeInfo(
        id="classic",
        label="Classic",
        description="Spin any club-season, draft your XI, see how the season plays out.",
    ),
    GameModeInfo(
        id="budget",
        label="Budget Draft",
        description="Same draft, but every player costs money — build the best XI under a cap.",
        has_budget=True,
    ),
    GameModeInfo(
        id="peak-xi",
        label="Peak XI",
        description="Pick one club and mix eras — draft from any of its seasons in the dataset.",
        needs_club=True,
    ),
    GameModeInfo(
        id="duel",
        label="Head-to-Head",
        description="Two players, same device, draft from the same reveals and compare results.",
    ),
]


def get_mode(mode_id: str) -> GameModeInfo | None:
    return next((m for m in GAME_MODES if m.id == mode_id), None)
