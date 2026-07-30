# DraftChamp

A football "draft roulette" game: spin a club+season combo, draft one player
per round into a formation slot, and once your XI is complete, simulate a
season from it and share the result.

v1 status: the draft loop, formations, simulation engine, and share/result
flow are built and tested. **No real league data yet** — `data/league-data.json`
under `src/leagues/premier-fiction/` ships as an empty stub; see the README
next to it for the schema and how real data will be added.

## Develop

```bash
npm install
npm run dev       # start the dev server
npm test          # run unit tests (Vitest)
npm run build     # type-check + production build
```

While there's no real league data, append `?fixture=test` to the dev server
URL to play through the full loop against a small synthetic league
(`tests/fixtures/test-league.ts`) — dev-only, not shipped in production
builds.

## Project layout

- `src/leagues/` — league data contract (`types.ts`), registry, and each
  league's data module (currently just `premier-fiction`, a stub).
- `src/engine/` — pure, framework-free game logic: formations/eligibility,
  the draft/spin engine, the season simulation, and the seeded RNG.
- `src/state/` — the draft session's `useReducer` + Context state.
- `src/components/`, `src/screens/` — the UI.
- `src/utils/` — canvas result export and Web Share API (+ download fallback).
- `tests/` — unit tests for `src/engine/*` and the shared test fixture.
