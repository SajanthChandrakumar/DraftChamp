"""Generate the synthetic fixture league used by tests and local dev.

TEST/DEV DATA ONLY — these are invented players, not real ones. Run with:
    uv run python scripts/make_fixture_league.py
"""

from __future__ import annotations

import json
from pathlib import Path

SPECS: list[tuple[list[str], str]] = [
    (["GK"], "Keeper"),
    (["CB"], "Center Back A"),
    (["CB"], "Center Back B"),
    (["LB"], "Left Back"),
    (["RB"], "Right Back"),
    (["CB"], "Sweeper"),
    (["CM"], "Midfielder A"),
    (["CM"], "Midfielder B"),
    (["CDM"], "Holding Mid"),
    (["LM"], "Left Mid"),
    (["RM"], "Right Mid"),
    (["ST"], "Striker A"),
    (["ST"], "Striker B"),
    (["LW"], "Winger"),
]


def make_squad(start_id: int, overall_base: int) -> list[dict]:
    squad = []
    for i, (positions, label) in enumerate(SPECS):
        overall = overall_base + (i % 5)
        pid = start_id + i
        squad.append(
            {
                "id": pid,
                "name": f"{label} #{pid}",
                "positions": positions,
                "overall": overall,
                "age": 24,
                "shirtNumber": pid % 99,
                "marketValue": overall * 1_000_000,
                "attributes": {
                    "pace": overall,
                    "shooting": overall,
                    "passing": overall,
                    "dribbling": overall,
                    "defending": overall,
                    "physical": overall,
                },
            }
        )
    return squad


def build() -> dict:
    return {
        "id": "fixture-league",
        "displayName": "Fixture League",
        "teams": {
            "TMA": {"name": "Test Town A"},
            "TMB": {"name": "Test Town B"},
            "TMC": {"name": "Test Town C"},
        },
        "years": [2023, 2024],
        "combos": [["TMA", 2023], ["TMA", 2024], ["TMB", 2024], ["TMC", 2023]],
        "squads": {
            "TMA|2023": make_squad(1, 70),
            "TMA|2024": make_squad(300, 74),
            "TMB|2024": make_squad(100, 78),
            "TMC|2023": make_squad(200, 60),
        },
        "dataVersion": "fixture-1",
    }


if __name__ == "__main__":
    out = Path(__file__).parent.parent / "app" / "data" / "fixture_league.json"
    out.write_text(json.dumps(build(), indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out}")
