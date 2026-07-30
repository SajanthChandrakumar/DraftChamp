# DraftChamp

A football draft game: spin a club-season, draft one player per round into a
formation slot, and once your XI is complete, play out a season and find out
which real Premier League records your squad broke.

You don't pick a challenge up front — you build the squad, then the result
tells you what you achieved.

## Architecture

A monorepo with a clear split: **the server owns the game, the client draws it.**

```
apps/
  api/    FastAPI backend — dataset, draft rules, season simulation,
          record evaluation. The single source of truth.
  web/    React + Vite frontend — renders the pitch and collects taps.
          Never computes a result.
```

The client only ever tells the server *which player it placed where*; ratings,
costs and outcomes always come from the server's own data, and every request is
re-validated (unknown players, duplicates, out-of-position placements and
budget overspends are all rejected).

## Running it

```bash
npm run install:all   # installs both apps (npm + uv)
npm run dev           # API on :8000, web on :5173
npm test              # pytest + vitest
```

There is no real dataset yet, so the default league file is an empty stub. To
play against a synthetic league:

```bash
npm run dev:fixture
```

## Game modes

Modes are *draft-rule variants* — they change what you're allowed to draft, so
they're chosen before the draft starts:

- **Classic** — spin any club-season.
- **Budget Draft** — every player costs money; build the best XI under a cap.
- **Peak XI** — pick one club and mix eras; spins are restricted to that club's
  own seasons.
- **Head-to-Head** — two players, one device, drafting from the same reveals.

Records are *not* a mode. Every completed XI is scored against all of them.

## Adding the real dataset

`apps/api/app/data/league_data.json` is the seam. Point
`DRAFTCHAMP_LEAGUE_FILE` at another file to swap datasets without touching any
code — see the README next to it for the expected schema.

## Layout

- `apps/api/app/engine/` — formations/eligibility, season simulation, records,
  and the seeded RNG. Pure logic, no framework.
- `apps/api/app/main.py` — the HTTP surface.
- `apps/web/src/api/` — typed API client mirroring the server's models.
- `apps/web/src/game/` — client-side eligibility helpers (for instant slot
  highlighting) and the bootstrapped game-data context.
- `apps/web/src/state/` — draft and duel session reducers.
- `apps/web/src/components/`, `src/screens/` — the UI.
