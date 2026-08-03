"""Convert the EA Sports FC "complete player dataset" (Kaggle, stefanoleone992)
into DraftChamp's LeagueData schema, filtered to the English Premier League.

Source: https://www.kaggle.com/datasets/stefanoleone992/ea-sports-fc-24-complete-player-dataset
Not committed to this repo — point --players/--teams at wherever you downloaded
male_players.csv / male_teams.csv.

Usage:
    uv run python scripts/convert_premier_league_dataset.py \
        --players /path/to/male_players.csv \
        --teams /path/to/male_teams.csv \
        --out app/data/league_data.json

Notes on the source data (verified by inspection, not assumed):
- league_id "13" is the English Premier League across every fifa_version in the
  dataset (nationality_name "England", always exactly 20 clubs) — the string
  "Premier League" alone is not enough to filter by, several other countries'
  top flights share that literal name in this dataset.
- fifa_version N corresponds to the season starting in year N + 1999 (verified
  against each row's update_as_of date, e.g. version 24 -> update_as_of
  2023-09-22 -> the 2023-24 season).
- player_positions already uses exactly DraftChamp's position vocabulary
  (GK/CB/LB/RB/LWB/RWB/CDM/CM/CAM/LM/RM/LW/RW/ST/CF) — no remapping needed.
- Goalkeepers have empty pace/shooting/passing/dribbling/defending/physic in
  this dataset (they carry separate goalkeeping_* stats instead). We fall
  back those six fields to the player's overall rating so a keeper's card
  isn't all zeros — this only affects display; the simulation itself scores
  keepers off `overall`, not the six sub-attributes.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

PREMIER_LEAGUE_ID = "13.0"
PREMIER_LEAGUE_ID_TEAMS_CSV = "13"  # male_teams.csv doesn't carry the ".0" suffix

# Curated, human-readable codes for every club that appeared in the Premier
# League across FIFA 15-24. Keyed by team_id (male_teams.csv / club_team_id in
# male_players.csv), which is stable for a given club across seasons.
TEAM_CODES: dict[str, tuple[str, str]] = {
    "1943": ("BOU", "AFC Bournemouth"),
    "1": ("ARS", "Arsenal"),
    "2": ("AVL", "Aston Villa"),
    "1925": ("BRE", "Brentford"),
    "1808": ("BHA", "Brighton & Hove Albion"),
    "1796": ("BUR", "Burnley"),
    "1961": ("CAR", "Cardiff City"),
    "5": ("CHE", "Chelsea"),
    "1799": ("CRY", "Crystal Palace"),
    "7": ("EVE", "Everton"),
    "144": ("FUL", "Fulham"),
    "1939": ("HUD", "Huddersfield Town"),
    "1952": ("HUL", "Hull City"),
    "8": ("LEE", "Leeds United"),
    "95": ("LEI", "Leicester City"),
    "9": ("LIV", "Liverpool"),
    "1923": ("LUT", "Luton Town"),
    "10": ("MCI", "Manchester City"),
    "11": ("MUN", "Manchester United"),
    "12": ("MID", "Middlesbrough"),
    "13": ("NEW", "Newcastle United"),
    "1792": ("NOR", "Norwich City"),
    "14": ("NFO", "Nottingham Forest"),
    "15": ("QPR", "Queens Park Rangers"),
    "1794": ("SHU", "Sheffield United"),
    "17": ("SOU", "Southampton"),
    "1806": ("STK", "Stoke City"),
    "106": ("SUN", "Sunderland"),
    "1960": ("SWA", "Swansea City"),
    "18": ("TOT", "Tottenham Hotspur"),
    "1795": ("WAT", "Watford"),
    "109": ("WBA", "West Bromwich Albion"),
    "19": ("WHU", "West Ham United"),
    "110": ("WOL", "Wolverhampton Wanderers"),
}

ATTRIBUTE_FIELDS = {
    "pace": "pace",
    "shooting": "shooting",
    "passing": "passing",
    "dribbling": "dribbling",
    "defending": "defending",
    "physical": "physic",  # EA's own CSV column is named "physic"
}


def season_year(fifa_version: str) -> int:
    return int(float(fifa_version)) + 1999


def build_teams_and_combos(teams_csv: Path) -> tuple[dict, list]:
    teams: dict[str, dict] = {}
    combos: list[list] = []
    seen_combos = set()

    with teams_csv.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["league_id"] != PREMIER_LEAGUE_ID_TEAMS_CSV:
                continue
            team_id = row["team_id"]
            if team_id not in TEAM_CODES:
                raise ValueError(
                    f"Unmapped Premier League team_id {team_id!r} ({row['team_name']!r}) — "
                    "add it to TEAM_CODES."
                )
            code, name = TEAM_CODES[team_id]
            teams.setdefault(code, {"name": name})

            season = season_year(row["fifa_version"])
            key = (code, season)
            if key not in seen_combos:
                seen_combos.add(key)
                combos.append([code, season])

    combos.sort(key=lambda c: (c[1], c[0]))
    return teams, combos


def parse_int(value: str, default: int | None = None) -> int | None:
    if value in ("", None):
        return default
    return int(float(value))


def build_squads(players_csv: Path) -> dict[str, list[dict]]:
    squads: dict[str, list[dict]] = {}

    with players_csv.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["league_id"] != PREMIER_LEAGUE_ID:
                continue

            team_id = row["club_team_id"]
            if team_id not in TEAM_CODES:
                continue  # defensive: a club_team_id we haven't seen in teams.csv
            code, _ = TEAM_CODES[team_id]
            season = season_year(row["fifa_version"])
            key = f"{code}|{season}"

            overall = parse_int(row["overall"])
            attributes = {}
            for attr_name, column in ATTRIBUTE_FIELDS.items():
                attributes[attr_name] = parse_int(row[column], default=overall)

            player = {
                "id": int(row["player_id"]),
                "name": row["short_name"],
                "positions": [p.strip() for p in row["player_positions"].split(",")],
                "overall": overall,
                "age": parse_int(row["age"]),
                "nationality": row["nationality_name"],
                "shirtNumber": parse_int(row["club_jersey_number"]),
                "marketValue": parse_int(row["value_eur"]),
                "attributes": attributes,
            }
            squads.setdefault(key, []).append(player)

    return squads


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--players", required=True, type=Path)
    parser.add_argument("--teams", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    teams, combos = build_teams_and_combos(args.teams)
    squads = build_squads(args.players)

    missing = [c for c in combos if f"{c[0]}|{c[1]}" not in squads]
    if missing:
        raise RuntimeError(f"{len(missing)} combos have no squad, e.g. {missing[:5]}")

    years = sorted({c[1] for c in combos})

    league_data = {
        "id": "premier-league",
        "displayName": "Premier League",
        "teams": teams,
        "years": years,
        "combos": combos,
        "squads": squads,
        "dataVersion": "pl-fifa15-24-v1",
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(league_data), encoding="utf-8")

    total_players = sum(len(v) for v in squads.values())
    print(
        f"Wrote {args.out}: {len(teams)} clubs, {len(years)} seasons "
        f"({years[0]}-{years[-1]}), {len(combos)} combos, {total_players} player rows"
    )


if __name__ == "__main__":
    main()
