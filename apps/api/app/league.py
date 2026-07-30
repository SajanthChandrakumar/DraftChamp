"""League dataset loading.

The dataset is loaded once at import and held in memory, keyed by
``TEAM|SEASON`` so a single squad lookup is O(1). Which file is loaded is
controlled by ``DRAFTCHAMP_LEAGUE_FILE``; this is the seam where the real
(large) dataset gets swapped in for the placeholder without touching any
other module.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from app.models import Combo, Player, Team

DATA_DIR = Path(__file__).parent / "data"
DEFAULT_LEAGUE_FILE = DATA_DIR / "league_data.json"


@dataclass
class LeagueDataset:
    id: str
    display_name: str
    teams: dict[str, Team]
    years: list[int]
    combos: list[Combo]
    squads: dict[str, list[Player]]
    data_version: str

    def squad(self, team: str, season: int) -> list[Player] | None:
        return self.squads.get(f"{team}|{season}")

    def combos_for_club(self, team: str) -> list[Combo]:
        return [c for c in self.combos if c.team == team]


def _league_file() -> Path:
    configured = os.environ.get("DRAFTCHAMP_LEAGUE_FILE")
    return Path(configured) if configured else DEFAULT_LEAGUE_FILE


@lru_cache(maxsize=1)
def load_league() -> LeagueDataset:
    path = _league_file()
    raw = json.loads(path.read_text(encoding="utf-8"))

    teams = {code: Team(code=code, name=t["name"]) for code, t in raw.get("teams", {}).items()}
    combos = [Combo(team=c[0], season=c[1]) for c in raw.get("combos", [])]
    squads = {
        key: [Player.model_validate(p) for p in players]
        for key, players in raw.get("squads", {}).items()
    }

    return LeagueDataset(
        id=raw.get("id", "unknown"),
        display_name=raw.get("displayName", "Unknown League"),
        teams=teams,
        years=raw.get("years", []),
        combos=combos,
        squads=squads,
        data_version=raw.get("dataVersion", "0"),
    )
