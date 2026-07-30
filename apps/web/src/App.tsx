import { useEffect, useState } from "react";
import { api, ApiError } from "./api/client";
import type { GameModeId } from "./api/types";
import { GameDataProvider, type GameData } from "./game/GameDataContext";
import { DraftProvider } from "./state/draftContext";
import { DuelProvider } from "./state/duelContext";
import { ModeSelectScreen } from "./screens/ModeSelectScreen";
import { SoloFlow } from "./screens/SoloFlow";
import { DuelFlow } from "./screens/DuelFlow";
import "./App.css";

export default function App() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<GameModeId | null>(null);

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
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong loading the game."
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="app-empty">
        <h1>DraftChamp</h1>
        <p>{error}</p>
        <p className="app-empty__hint">
          Start the API with <code>uv run uvicorn app.main:app</code> in <code>apps/api</code>.
        </p>
      </div>
    );
  }

  if (!gameData) {
    return <div className="app-loading">Loading…</div>;
  }

  if (gameData.league.combos.length === 0) {
    return (
      <div className="app-empty">
        <h1>DraftChamp</h1>
        <p>No league data loaded yet. Check back once the dataset is in.</p>
      </div>
    );
  }

  return (
    <GameDataProvider value={gameData}>
      {!mode ? (
        <ModeSelectScreen onSelect={setMode} />
      ) : mode === "duel" ? (
        <DuelProvider>
          <DuelFlow onBackToModes={() => setMode(null)} />
        </DuelProvider>
      ) : (
        <DraftProvider key={mode}>
          <SoloFlow mode={mode} onBackToModes={() => setMode(null)} />
        </DraftProvider>
      )}
    </GameDataProvider>
  );
}
