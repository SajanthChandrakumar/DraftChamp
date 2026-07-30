"""DraftChamp API.

The server owns the game: it holds the dataset, decides what a squad contains,
runs the season simulation and scores the result against every Premier League
record. The client draws the pitch and collects taps — it never computes a
result, and anything it sends is re-validated here.
"""

from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.engine import records as records_engine
from app.engine.formations import FORMATIONS, POS_TO_FAM, eligible_families
from app.engine.modes import DEFAULT_BUDGET_CAP, GAME_MODES
from app.engine.simulation import simulate_season
from app.league import load_league
from app.models import (
    ChallengeResult,
    Formation,
    FormationSlot,
    LeagueMeta,
    Player,
    RecordInfo,
    SeasonResult,
    SimulateRequest,
    SimulateResponse,
    SquadResponse,
)

app = FastAPI(
    title="DraftChamp API",
    version="0.1.0",
    description="League data, draft rules, season simulation and record evaluation.",
)

_allowed_origins = os.environ.get(
    "DRAFTCHAMP_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins if o.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    league = load_league()
    return {
        "status": "ok",
        "league": league.id,
        "dataVersion": league.data_version,
        "combos": str(len(league.combos)),
    }


@app.get("/api/league", response_model=LeagueMeta)
def get_league() -> LeagueMeta:
    """League metadata only — never the squads, so this stays small no matter
    how large the underlying dataset grows."""
    league = load_league()
    return LeagueMeta(
        id=league.id,
        display_name=league.display_name,
        teams=list(league.teams.values()),
        years=league.years,
        combos=league.combos,
        data_version=league.data_version,
    )


@app.get("/api/formations", response_model=list[Formation])
def get_formations() -> list[Formation]:
    """Formation layouts. The client renders and highlights from these; the
    server re-checks every placement against the same definitions."""
    return [
        Formation(
            id=formation_id,
            slots=[
                FormationSlot(id=s.id, label=s.label, fam=s.fam, x=s.x, y=s.y) for s in slots
            ],
        )
        for formation_id, slots in FORMATIONS.items()
    ]


@app.get("/api/position-families")
def get_position_families() -> dict[str, str]:
    return dict(POS_TO_FAM)


@app.get("/api/modes")
def get_modes() -> list[dict]:
    return [
        {
            "id": m.id,
            "label": m.label,
            "description": m.description,
            "needsClub": m.needs_club,
            "hasBudget": m.has_budget,
            "defaultBudgetCap": DEFAULT_BUDGET_CAP if m.has_budget else None,
        }
        for m in GAME_MODES
    ]


@app.get("/api/records", response_model=list[RecordInfo])
def get_records() -> list[RecordInfo]:
    return [
        RecordInfo(
            id=r.id,
            label=r.label,
            description=r.description,
            metric=r.metric,
            value=r.value,
            holder=r.holder,
            season=r.season,
            lower_is_better=r.lower_is_better,
        )
        for r in records_engine.PL_RECORDS
    ]


@app.get("/api/squad/{team}/{season}", response_model=SquadResponse)
def get_squad(team: str, season: int) -> SquadResponse:
    league = load_league()
    players = league.squad(team, season)
    if players is None:
        raise HTTPException(status_code=404, detail=f"No squad for {team} {season}")
    team_meta = league.teams.get(team)
    return SquadResponse(
        team=team,
        season=season,
        team_name=team_meta.name if team_meta else team,
        players=players,
    )


def _resolve_xi(request: SimulateRequest) -> tuple[dict[str, Player], int]:
    """Look every drafted player up in the dataset and validate the XI.

    Nothing about the players is taken from the request beyond which player was
    placed where — ratings and costs always come from the server's own data.
    """
    league = load_league()

    slots = FORMATIONS.get(request.formation_id)
    if slots is None:
        raise HTTPException(status_code=422, detail=f"Unknown formation {request.formation_id!r}")

    valid_slot_ids = {s.id: s for s in slots}
    filled: dict[str, Player] = {}
    seen_players: set[int] = set()
    total_cost = 0

    for assignment in request.slots:
        slot = valid_slot_ids.get(assignment.slot_id)
        if slot is None:
            raise HTTPException(
                status_code=422,
                detail=f"Slot {assignment.slot_id!r} is not part of {request.formation_id}",
            )
        if assignment.slot_id in filled:
            raise HTTPException(
                status_code=422, detail=f"Slot {assignment.slot_id!r} assigned twice"
            )

        squad = league.squad(assignment.team, assignment.season)
        if squad is None:
            raise HTTPException(
                status_code=422,
                detail=f"No squad for {assignment.team} {assignment.season}",
            )
        player = next((p for p in squad if p.id == assignment.player_id), None)
        if player is None:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Player {assignment.player_id} is not in "
                    f"{assignment.team} {assignment.season}"
                ),
            )

        if player.id in seen_players:
            raise HTTPException(
                status_code=422, detail=f"Player {player.id} drafted more than once"
            )
        if slot.fam not in eligible_families(player):
            raise HTTPException(
                status_code=422,
                detail=(
                    f"{player.name} ({'/'.join(player.positions)}) cannot play "
                    f"in a {slot.fam} slot"
                ),
            )

        seen_players.add(player.id)
        filled[assignment.slot_id] = player
        total_cost += player.market_value or 0

    missing = [s.id for s in slots if s.id not in filled]
    if missing:
        raise HTTPException(
            status_code=422, detail=f"XI incomplete — missing slots: {', '.join(missing)}"
        )

    return filled, total_cost


@app.post("/api/simulate", response_model=SimulateResponse)
def simulate(request: SimulateRequest) -> SimulateResponse:
    filled, total_cost = _resolve_xi(request)

    if request.mode == "budget":
        cap = request.budget_cap if request.budget_cap is not None else DEFAULT_BUDGET_CAP
        if total_cost > cap:
            raise HTTPException(
                status_code=422,
                detail=f"Squad costs {total_cost} which exceeds the budget cap of {cap}",
            )

    season = simulate_season(filled, request.formation_id)
    outcomes = records_engine.evaluate_all(season)

    challenges = [
        ChallengeResult(
            id=o.record.id,
            label=o.record.label,
            holder=o.record.holder,
            season=o.record.season,
            target=o.record.value,
            actual=o.actual,
            achieved=o.achieved,
            message=o.message,
        )
        for o in outcomes
    ]

    return SimulateResponse(
        season=SeasonResult(
            wins=season.wins,
            draws=season.draws,
            losses=season.losses,
            points=season.points,
            league_position=season.league_position,
            tier=season.tier,
            goals_for=season.goals_for,
            goals_conceded=season.goals_conceded,
            top_player_id=season.top_player_id,
            top_player_name=season.top_player_name,
            top_scorer_id=season.top_scorer_id,
            top_scorer_name=season.top_scorer_name,
            top_scorer_goals=season.top_scorer_goals,
            squad_strength=season.squad_strength,
            narrative=season.narrative,
        ),
        challenges=challenges,
        challenges_achieved=sum(1 for c in challenges if c.achieved),
        total_spent=total_cost if request.mode == "budget" else None,
    )
