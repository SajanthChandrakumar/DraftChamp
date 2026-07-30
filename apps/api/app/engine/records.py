"""Real Premier League records, evaluated against a simulated season.

Design note: records are *not* chosen before the draft. Every completed XI is
scored against the whole list, and the result screen reports which ones the
squad beat. Picking a target up front asked the player to commit to a goal
before seeing a single card; evaluating afterwards turns each draft into a
handful of things you might have hit without knowing it.

Each record still carries a `strength_group` and `required_strength`, though
— a client-side live gauge (optional, informational only) can compare a
partially-drafted XI's average overall in that group against the threshold
and show how close it is. That's feedback on draft *quality*, not a
commitment to one target; every record is still evaluated at the end.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.engine.simulation import (
    GAMES_PER_SEASON,
    SeasonRecord,
    required_attack_strength_for_goals,
    required_attack_strength_for_top_scorer,
    required_defense_strength_for_goals_conceded,
    required_overall_strength,
)

StrengthGroup = Literal["overall", "attack", "defense"]


@dataclass(frozen=True)
class PLRecord:
    id: str
    label: str
    description: str
    metric: str
    value: int
    holder: str
    season: str
    strength_group: StrengthGroup
    required_strength: float
    lower_is_better: bool = False


PL_RECORDS: list[PLRecord] = [
    PLRecord(
        id="most-points",
        label="Most points in a season",
        description=(
            "Manchester City set the record for the most points in a single "
            "Premier League season."
        ),
        metric="points",
        value=100,
        holder="Manchester City",
        season="2017-18",
        strength_group="overall",
        required_strength=required_overall_strength(),
    ),
    PLRecord(
        id="invincible",
        label="Unbeaten season (“The Invincibles”)",
        description="Arsenal went the entire 38-game season without losing a match.",
        metric="unbeaten",
        value=0,
        holder="Arsenal",
        season="2003-04",
        lower_is_better=True,
        strength_group="overall",
        required_strength=required_overall_strength(),
    ),
    PLRecord(
        id="fewest-conceded",
        label="Fewest goals conceded",
        description="Chelsea conceded a record-low tally across the season.",
        metric="goals_conceded",
        value=15,
        holder="Chelsea",
        season="2004-05",
        lower_is_better=True,
        strength_group="defense",
        required_strength=required_defense_strength_for_goals_conceded(15),
    ),
    PLRecord(
        id="most-scored",
        label="Most goals scored in a season",
        description="Manchester City scored a record number of league goals in one season.",
        metric="goals_for",
        value=106,
        holder="Manchester City",
        season="2017-18",
        strength_group="attack",
        required_strength=required_attack_strength_for_goals(106),
    ),
    PLRecord(
        id="top-scorer",
        label="Most goals by one player in a season",
        description="Erling Haaland scored a record haul in a single 38-game season.",
        metric="top_scorer_goals",
        value=36,
        holder="Erling Haaland",
        season="2022-23",
        strength_group="attack",
        required_strength=required_attack_strength_for_top_scorer(36),
    ),
    PLRecord(
        id="most-wins",
        label="Most wins in a season",
        description="Manchester City won a record number of matches in a 38-game season.",
        metric="wins",
        value=32,
        holder="Manchester City",
        strength_group="overall",
        required_strength=required_overall_strength(),
        season="2017-18",
    ),
]


def get_record(record_id: str) -> PLRecord | None:
    return next((r for r in PL_RECORDS if r.id == record_id), None)


def _actual_for(season: SeasonRecord, record: PLRecord) -> int:
    if record.metric == "points":
        return season.points
    if record.metric == "unbeaten":
        return season.losses
    if record.metric == "goals_conceded":
        return season.goals_conceded
    if record.metric == "goals_for":
        return season.goals_for
    if record.metric == "top_scorer_goals":
        return season.top_scorer_goals
    if record.metric == "wins":
        return season.wins
    raise ValueError(f"Unknown record metric: {record.metric}")


def _message_for(record: PLRecord, actual: int, achieved: bool) -> str:
    held_by = f"{record.holder} ({record.season})"

    if record.metric == "unbeaten":
        if achieved:
            return f"Unbeaten! You matched {held_by}'s invincible season."
        plural = "" if actual == 1 else "es"
        return f"{actual} loss{plural} — {held_by} went the whole season unbeaten."

    if achieved:
        return f"Beaten! {actual} vs {held_by}'s {record.value}."

    gap = abs(record.value - actual)
    if record.lower_is_better:
        return f"{actual} — {gap} more than {held_by}'s record {record.value}."
    return f"{actual} — {gap} short of {held_by}'s {record.value}."


@dataclass(frozen=True)
class ChallengeOutcome:
    record: PLRecord
    actual: int
    achieved: bool
    message: str


def evaluate_all(season: SeasonRecord) -> list[ChallengeOutcome]:
    """Score a simulated season against every record."""
    outcomes: list[ChallengeOutcome] = []
    for record in PL_RECORDS:
        actual = _actual_for(season, record)
        achieved = actual <= record.value if record.lower_is_better else actual >= record.value
        outcomes.append(
            ChallengeOutcome(
                record=record,
                actual=actual,
                achieved=achieved,
                message=_message_for(record, actual, achieved),
            )
        )
    return outcomes


__all__ = [
    "GAMES_PER_SEASON",
    "PL_RECORDS",
    "ChallengeOutcome",
    "PLRecord",
    "evaluate_all",
    "get_record",
]
