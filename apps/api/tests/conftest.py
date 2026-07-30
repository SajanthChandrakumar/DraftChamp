from __future__ import annotations

import os
from pathlib import Path

import pytest

FIXTURE_LEAGUE = Path(__file__).parent.parent / "app" / "data" / "fixture_league.json"
# Point the whole test session at the synthetic fixture league before anything
# imports app.league (which caches the dataset on first load).
os.environ["DRAFTCHAMP_LEAGUE_FILE"] = str(FIXTURE_LEAGUE)

from fastapi.testclient import TestClient  # noqa: E402

from app.league import load_league  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session")
def league():
    return load_league()


@pytest.fixture(scope="session")
def players_by_id(league) -> dict[int, object]:
    return {p.id: p for squad in league.squads.values() for p in squad}


@pytest.fixture(scope="session")
def squad_of(league):
    """Map player id -> (team, season) so tests can build valid assignments."""
    lookup: dict[int, tuple[str, int]] = {}
    for key, squad in league.squads.items():
        team, season = key.split("|")
        for player in squad:
            lookup[player.id] = (team, int(season))
    return lookup
