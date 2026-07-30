import type { League } from "./types";
import { premierFiction } from "./premier-fiction";

const LEAGUES: Record<string, () => Promise<League>> = {
  "premier-fiction": async () => premierFiction,
};

/**
 * Dev-only escape hatch: visiting `?fixture=test` in `npm run dev` swaps in a
 * small synthetic league (tests/fixtures/test-league.ts) so the draft loop is
 * manually clickable before real league data exists. Gated by import.meta.env.DEV
 * so it cannot be reached in a production build.
 */
async function loadTestFixtureLeague(): Promise<League> {
  const { TEST_LEAGUE_FIXTURE } = await import("../../tests/fixtures/test-league");
  return { id: TEST_LEAGUE_FIXTURE.id, loadData: async () => TEST_LEAGUE_FIXTURE };
}

export async function loadActiveLeague(): Promise<League> {
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fixture") === "test") {
      return loadTestFixtureLeague();
    }
  }
  return LEAGUES["premier-fiction"]();
}
