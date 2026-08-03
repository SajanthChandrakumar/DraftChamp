"""The Daily Draft.

Everyone who plays on the same day faces the identical puzzle: the same
formation and the same ordered run of club-season reveals. That is the whole
point — a score only means something if the person you are comparing it to had
the same eleven picks to work with.

The day is decided server-side in UTC. Deriving it from the client clock would
let anyone travel to another day's draft by changing their system time.

Both the formation and the sequence come from the shared seeded PRNG, so the
draft for a given date is reproducible from the date alone — nothing is stored.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone

from app.engine.rng import hash_string, seeded_rng
from app.models import Combo

# Eleven successful picks fill an XI, but reveals where nothing is eligible get
# spun past, so a run needs considerably more than eleven entries. This is long
# enough that reaching the end is implausible; the client wraps around it
# anyway, which keeps the sequence infinite without ever going non-deterministic.
SEQUENCE_LENGTH = 40


@dataclass(frozen=True)
class DailyDraft:
    date: str
    seed: int
    formation_id: str
    combos: list[Combo]


def today_utc() -> str:
    """The current UTC date as YYYY-MM-DD."""
    return datetime.now(timezone.utc).date().isoformat()


def parse_date(value: str) -> str:
    """Validate a YYYY-MM-DD date string, returning it normalised."""
    return date.fromisoformat(value).isoformat()


def build_daily(date_str: str, combos: list[Combo], formation_ids: list[str]) -> DailyDraft:
    """Derive the draft for a date. Same date + same dataset -> same draft."""
    if not combos:
        raise ValueError("Cannot build a daily draft with no club-seasons")
    if not formation_ids:
        raise ValueError("Cannot build a daily draft with no formations")

    seed = hash_string(f"draftchamp-daily-{date_str}")
    rng = seeded_rng(seed)

    formation_id = formation_ids[int(rng() * len(formation_ids)) % len(formation_ids)]

    sequence: list[Combo] = []
    while len(sequence) < SEQUENCE_LENGTH:
        pick = combos[int(rng() * len(combos)) % len(combos)]
        # Back-to-back repeats of the same club-season read like a bug to a
        # player, so skip them — with hundreds of combos this rarely triggers.
        if sequence and sequence[-1] == pick:
            continue
        sequence.append(pick)

    return DailyDraft(date=date_str, seed=seed, formation_id=formation_id, combos=sequence)
