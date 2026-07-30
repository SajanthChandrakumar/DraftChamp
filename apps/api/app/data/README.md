# premier-league league data

This is the live dataset: the 20 English Premier League clubs across the
2014-15 through 2023-24 seasons (10 seasons, ~200 club-season combos).

## Provenance

Derived from the EA Sports FC "complete player dataset" (Kaggle, stefanoleone992:
`male_players.csv` / `male_teams.csv`, FIFA 15 through FC 24), filtered to
`league_id == 13` (the English Premier League — verified by inspection, not
just the league name, since several countries' top flights share the literal
string "Premier League" in that dataset).

**This project stays local and is not distributed** — the underlying ratings
are EA's proprietary data, and shipping this file as part of a published
product would need a from-scratch attribute model derived from open
performance stats instead. See `scripts/convert_premier_league_dataset.py` for
the exact filtering/mapping logic and its documented assumptions.

The raw source CSVs (~28MB/~2MB) are intentionally **not** committed to this
repo. To regenerate this file from a fresh copy of the dataset:

```bash
uv run python scripts/convert_premier_league_dataset.py \
  --players /path/to/male_players.csv \
  --teams /path/to/male_teams.csv \
  --out app/data/league_data.json
```

## Shape

- `teams`: map of a short `TeamCode` (e.g. `"ARS"`) to `{ name }`. No crest
  data — kits/badges are drawn programmatically on the frontend rather than
  shipping licensed crest images.
- `years`: `[2014, ..., 2023]` — the season a year number represents is that
  year's season (e.g. `2017` = the 2017-18 season).
- `combos`: the `[TeamCode, Season]` pairs the spin draws from. Every entry
  here has a matching key in `squads` (the conversion script asserts this).
- `squads`: keyed by `` `${TeamCode}|${Season}` `` (e.g. `"ARS|2023"`), each
  value an array of `Player` objects for that club-season.
- `dataVersion`: bump this (see the conversion script) whenever the data
  content changes.

## Known quirks of the source data

- Goalkeepers carry empty `pace`/`shooting`/`passing`/`dribbling`/`defending`/
  `physical` in the source (EA tracks separate goalkeeping stats instead); the
  conversion script fills these from the player's `overall` so a keeper's card
  isn't all zeros. This only affects display — the simulation scores every
  player off `overall`, not the six sub-attributes.
- Squads are per-club-season snapshots as of each FIFA version's initial data
  pull (early-to-mid September of that season) — mid-season transfers aren't
  reflected.
