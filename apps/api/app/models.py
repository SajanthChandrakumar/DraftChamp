"""Shared API/domain models.

These Pydantic models are the single source of truth for the wire format:
FastAPI derives the OpenAPI schema from them, and the frontend's TypeScript
types are generated from that schema.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

PositionFamily = Literal["GK", "DEF", "MID", "FWD"]

Position = Literal[
    "GK",
    "CB",
    "LB",
    "RB",
    "LWB",
    "RWB",
    "CDM",
    "CM",
    "CAM",
    "LM",
    "RM",
    "LW",
    "RW",
    "ST",
    "CF",
]

GameMode = Literal["classic", "budget", "peak-xi", "duel", "daily"]


class PlayerAttributes(BaseModel):
    pace: int
    shooting: int
    passing: int
    dribbling: int
    defending: int
    physical: int


class Player(BaseModel):
    id: int
    name: str
    positions: list[Position]
    overall: int
    age: int
    shirt_number: int | None = Field(default=None, alias="shirtNumber")
    market_value: int | None = Field(default=None, alias="marketValue")
    attributes: PlayerAttributes

    model_config = {"populate_by_name": True}


class Team(BaseModel):
    code: str
    name: str


class Combo(BaseModel):
    team: str
    season: int


class FormationSlot(BaseModel):
    id: str
    label: str
    fam: PositionFamily
    x: float
    y: float


class Formation(BaseModel):
    id: str
    slots: list[FormationSlot]


class LeagueMeta(BaseModel):
    """League metadata without squads — kept small so the client never has to
    download the full dataset up front."""

    id: str
    display_name: str = Field(serialization_alias="displayName")
    teams: list[Team]
    years: list[int]
    combos: list[Combo]
    data_version: str = Field(serialization_alias="dataVersion")

    model_config = {"populate_by_name": True}


class SquadResponse(BaseModel):
    team: str
    season: int
    team_name: str = Field(serialization_alias="teamName")
    players: list[Player]

    model_config = {"populate_by_name": True}


class DailyDraftResponse(BaseModel):
    """The shared puzzle for one day: a fixed formation and a fixed run of
    reveals, both derived from the date."""

    date: str
    seed: int
    formation_id: str = Field(serialization_alias="formationId")
    combos: list[Combo]

    model_config = {"populate_by_name": True}


class RecordInfo(BaseModel):
    id: str
    label: str
    description: str
    metric: str
    value: int
    holder: str
    season: str
    strength_group: Literal["overall", "attack", "defense"] = Field(
        serialization_alias="strengthGroup"
    )
    required_strength: float = Field(serialization_alias="requiredStrength")
    lower_is_better: bool = Field(default=False, serialization_alias="lowerIsBetter")

    model_config = {"populate_by_name": True}


class ChallengeResult(BaseModel):
    """Post-draft evaluation of one record against the simulated season."""

    id: str
    label: str
    holder: str
    season: str
    target: int
    actual: int
    achieved: bool
    message: str


class SlotAssignment(BaseModel):
    """One drafted player. The team+season identify which squad the player was
    taken from, so the server can look the player up authoritatively rather
    than trusting client-supplied ratings."""

    slot_id: str = Field(alias="slotId")
    player_id: int = Field(alias="playerId")
    team: str
    season: int

    model_config = {"populate_by_name": True}


class SimulateRequest(BaseModel):
    formation_id: str = Field(alias="formationId")
    slots: list[SlotAssignment]
    mode: GameMode = "classic"
    budget_cap: int | None = Field(default=None, alias="budgetCap")

    model_config = {"populate_by_name": True}


class SeasonResult(BaseModel):
    wins: int
    draws: int
    losses: int
    points: int
    league_position: int = Field(serialization_alias="leaguePosition")
    tier: str
    goals_for: int = Field(serialization_alias="goalsFor")
    goals_conceded: int = Field(serialization_alias="goalsConceded")
    top_player_id: int = Field(serialization_alias="topPlayerId")
    top_player_name: str = Field(serialization_alias="topPlayerName")
    top_scorer_id: int = Field(serialization_alias="topScorerId")
    top_scorer_name: str = Field(serialization_alias="topScorerName")
    top_scorer_goals: int = Field(serialization_alias="topScorerGoals")
    squad_strength: float = Field(serialization_alias="squadStrength")
    narrative: str

    model_config = {"populate_by_name": True}


class SimulateResponse(BaseModel):
    season: SeasonResult
    challenges: list[ChallengeResult]
    challenges_achieved: int = Field(serialization_alias="challengesAchieved")
    total_spent: int | None = Field(default=None, serialization_alias="totalSpent")

    model_config = {"populate_by_name": True}
