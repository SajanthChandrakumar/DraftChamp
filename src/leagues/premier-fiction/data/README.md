# premier-fiction league data

This file is a placeholder. It is valid against the `LeagueData` type
(see `src/leagues/types.ts`) but ships with no real content:

```json
{ "teams": {}, "years": [], "combos": [], "squads": {}, "dataVersion": "0.0.0-unpopulated" }
```

## Expected shape when real data is added

- `teams`: map of a short `TeamCode` (e.g. `"EVE"`) to `{ code, name, crestUrl? }`.
  Leave `crestUrl` unset — this project draws kits/badges programmatically
  rather than shipping licensed crest images.
- `years`: the list of valid seasons across the whole dataset (e.g. `[1994, 1995, ...]`).
- `combos`: the pool of `[TeamCode, Season]` pairs the spin draws from. **Every entry
  here must have a matching key in `squads`** (see below) — the app does not
  validate this at runtime, so a mismatch will surface as an empty squad mid-draft.
- `squads`: keyed by `` `${TeamCode}|${Season}` `` (e.g. `"EVE|2017"`), each value an
  array of `Player` objects (see `Player` in `src/leagues/types.ts`) for that
  club-season.
- `dataVersion`: bump this whenever the data content changes, so any future
  caching or save-compatibility logic has something to key off of.

## Where the real data will come from

Per the project's data-sourcing decision, real content will be derived from
open sources (e.g. openfootball datasets, Wikipedia season squad lists) with
attributes computed from our own rating model — not copied from any
commercial game's ratings. That data has not been supplied yet; this stub
is the seam it will be dropped into.
