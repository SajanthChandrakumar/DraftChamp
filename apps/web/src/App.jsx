import { useEffect, useState } from "react";
import { api, ApiError } from "./api/client";
import { AppHeader } from "./components/AppHeader";
import { GameDataProvider } from "./game/GameDataContext";
import { DraftProvider } from "./state/draftContext";
import { DuelProvider } from "./state/duelContext";
import { ModeSelectScreen } from "./screens/ModeSelectScreen";
import { SoloFlow } from "./screens/SoloFlow";
import { DuelFlow } from "./screens/DuelFlow";
import { DailyFlow } from "./screens/DailyFlow";
import { HistoryScreen } from "./screens/HistoryScreen";
import "./App.css";

export default function App() {
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const goHome = () => {
    setMode(null);
    setShowHistory(false);
  };

  useEffect(() => {
    let cancelled = false;

    // The rules of the game come from the server; the client bootstraps once
    // and then only fetches squads on demand.
    Promise.all([
      api.league(),
      api.formations(),
      api.positionFamilies(),
      api.modes(),
      api.records(),
    ])
      .then(([league, formations, posToFam, modes, records]) => {
        if (!cancelled) setGameData({ league, formations, posToFam, modes, records });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Something went wrong loading the game.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <>
        <AppHeader showHome={false} />
        <div className="app-empty">
          <p>{error}</p>
          <p className="app-empty__hint">
            Start the API with <code>uv run uvicorn app.main:app</code> in <code>apps/api</code>.
          </p>
        </div>
      </>
    );
  }

  if (!gameData) {
    return (
      <>
        <AppHeader showHome={false} />
        <div className="app-loading">Loading…</div>
      </>
    );
  }

  if (gameData.league.combos.length === 0) {
    return (
      <>
        <AppHeader showHome={false} />
        <div className="app-empty">
          <p>No league data loaded yet. Check back once the dataset is in.</p>
        </div>
      </>
    );
  }

  const atHome = !mode && !showHistory;

  return (
    <GameDataProvider value={gameData}>
      <AppHeader showHome={!atHome} onHome={goHome} />
      {showHistory ? (
        <HistoryScreen onBack={() => setShowHistory(false)} />
      ) : !mode ? (
        <ModeSelectScreen onSelect={setMode} onShowHistory={() => setShowHistory(true)} />
      ) : mode === "duel" ? (
        <DuelProvider>
          <DuelFlow onBackToModes={() => setMode(null)} />
        </DuelProvider>
      ) : mode === "daily" ? (
        <DraftProvider>
          <DailyFlow onBackToModes={() => setMode(null)} />
        </DraftProvider>
      ) : (
        <DraftProvider key={mode}>
          <SoloFlow mode={mode} onBackToModes={() => setMode(null)} />
        </DraftProvider>
      )}
    </GameDataProvider>
  );
}
