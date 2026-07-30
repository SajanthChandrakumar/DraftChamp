import { useEffect, useState } from "react";
import type { LeagueData } from "./leagues/types";
import { loadActiveLeague } from "./leagues/registry";
import { DraftProvider, useDraftState } from "./state/draftContext";
import { HomeScreen } from "./screens/HomeScreen";
import { DraftScreen } from "./screens/DraftScreen";
import { ResultScreen } from "./screens/ResultScreen";
import "./App.css";

function GameScreens({ leagueData }: { leagueData: LeagueData }) {
  const state = useDraftState();

  switch (state.phase) {
    case "picking-formation":
      return <HomeScreen />;
    case "complete":
      return <ResultScreen />;
    default:
      return <DraftScreen leagueData={leagueData} />;
  }
}

export default function App() {
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadActiveLeague().then((league) =>
      league.loadData().then((data) => {
        if (!cancelled) setLeagueData(data);
      })
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (!leagueData) {
    return <div className="app-loading">Loading…</div>;
  }

  if (leagueData.combos.length === 0) {
    return (
      <div className="app-empty">
        <h1>DraftChamp</h1>
        <p>No league data loaded yet. Check back once the dataset is in.</p>
      </div>
    );
  }

  return (
    <DraftProvider>
      <GameScreens leagueData={leagueData} />
    </DraftProvider>
  );
}
