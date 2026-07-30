import { useEffect, useState } from "react";
import type { LeagueData } from "./leagues/types";
import { loadActiveLeague } from "./leagues/registry";
import type { GameModeId } from "./engine/modes";
import { DraftProvider, useDraftState } from "./state/draftContext";
import { DuelProvider } from "./state/duelContext";
import { ModeSelectScreen } from "./screens/ModeSelectScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { DraftScreen } from "./screens/DraftScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { DuelFlow } from "./screens/DuelFlow";
import "./App.css";

function ClassicGameScreens({
  mode,
  leagueData,
  onBackToModes,
}: {
  mode: GameModeId;
  leagueData: LeagueData;
  onBackToModes: () => void;
}) {
  const state = useDraftState();

  switch (state.phase) {
    case "picking-formation":
      return <HomeScreen mode={mode} leagueData={leagueData} onBackToModes={onBackToModes} />;
    case "complete":
      return <ResultScreen />;
    default:
      return <DraftScreen leagueData={leagueData} />;
  }
}

export default function App() {
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [mode, setMode] = useState<GameModeId | null>(null);

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

  if (!mode) {
    return <ModeSelectScreen onSelect={setMode} />;
  }

  if (mode === "duel") {
    return (
      <DuelProvider>
        <DuelFlow leagueData={leagueData} onBackToModes={() => setMode(null)} />
      </DuelProvider>
    );
  }

  return (
    <DraftProvider key={mode}>
      <ClassicGameScreens mode={mode} leagueData={leagueData} onBackToModes={() => setMode(null)} />
    </DraftProvider>
  );
}
