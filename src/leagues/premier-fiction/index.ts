import leagueDataJson from "./data/league-data.json";
import type { League, LeagueData } from "../types";

export const premierFiction: League = {
  id: "premier-fiction",
  loadData: async () => leagueDataJson as unknown as LeagueData,
};
