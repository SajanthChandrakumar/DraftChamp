import { useMemo, useState } from "react";
import { api } from "../api/client";
import { hasUsablePick, openSlotsFor, pickRandomCombo } from "../game/eligibility";
import { useGameData } from "../game/GameDataContext";
import { buildSpinReel } from "../game/spin";
import { computeChemistryScore } from "../game/chemistry";
import { ChemistryMeter } from "../components/ChemistryMeter";
import { ComboReveal } from "../components/ComboReveal";
import { Pitch } from "../components/Pitch";
import { PlayerCard } from "../components/PlayerCard";
import { playersOf } from "../state/draftContext";
import { useDuelDispatch, useDuelState } from "../state/duelContext";

const SPIN_MIN_MS = 900;

export function DuelDraftScreen() {
  const { league } = useGameData();
  const state = useDuelState();
  const dispatch = useDuelDispatch();
  const [spinError, setSpinError] = useState(null);
  const [spinReel, setSpinReel] = useState(null);

  const activeFormation = state.turn === "A" ? state.formationA : state.formationB;
  const activeFilled = state.turn === "A" ? state.filledA : state.filledB;
  const activePlayers = useMemo(() => playersOf(activeFilled), [activeFilled]);

  const available = useMemo(
    () => (state.currentSquad ?? []).filter((p) => !state.usedPlayerIds.has(p.id)),
    [state.currentSquad, state.usedPlayerIds]
  );

  const selectedPlayer = available.find((p) => p.id === state.selectedPlayerId) ?? null;

  const eligibleSlotIds = useMemo(() => {
    if (!selectedPlayer || !activeFormation) return new Set();
    return new Set(
      openSlotsFor(selectedPlayer, activeFormation, activePlayers).map((s) => s.id)
    );
  }, [selectedPlayer, activeFormation, activePlayers]);

  const canAct = useMemo(() => {
    if (!activeFormation) return false;
    return hasUsablePick(available, activeFormation, activePlayers, null);
  }, [available, activeFormation, activePlayers]);

  const activeFilledEntries = state.turn === "A" ? state.filledA : state.filledB;
  const chemistryScore = useMemo(
    () => computeChemistryScore(Object.values(activeFilledEntries)),
    [activeFilledEntries]
  );

  const handleSpin = async () => {
    setSpinError(null);

    const combo = pickRandomCombo(league.combos);
    const labelFor = (c) => `${league.teams.find((t) => t.code === c.team)?.name ?? c.team} ${c.season}`;
    setSpinReel(buildSpinReel(league.combos.map(labelFor), labelFor(combo)));

    try {
      const [squadResponse] = await Promise.all([
        api.squad(combo.team, combo.season),
        new Promise((resolve) => setTimeout(resolve, SPIN_MIN_MS)),
      ]);
      dispatch({ type: "SPIN_COMBO", combo, squad: squadResponse.players });
    } catch {
      setSpinError("Could not load that squad — try spinning again.");
    } finally {
      setSpinReel(null);
    }
  };

  if (!activeFormation) return null;

  const teamName = state.currentCombo
    ? (league.teams.find((t) => t.code === state.currentCombo.team)?.name ?? state.currentCombo.team)
    : null;

  const filledCountA = Object.keys(state.filledA).length;
  const filledCountB = Object.keys(state.filledB).length;

  return (
    <div className="draft-screen">
      <div className="duel-turn-banner">
        <span className={`duel-turn-banner__side duel-turn-banner__side--${state.turn.toLowerCase()}`}>
          Player {state.turn}'s pick
        </span>
        <span className="duel-turn-banner__scores">
          A: {filledCountA}/{state.formationA?.slots.length ?? 11} &middot; B: {filledCountB}/
          {state.formationB?.slots.length ?? 11}
        </span>
      </div>
      <div className="draft-screen__board">
        <Pitch
          formation={activeFormation}
          filledSlots={activePlayers}
          eligibleSlotIds={eligibleSlotIds}
          onSlotTap={(slotId) => {
            if (eligibleSlotIds.has(slotId)) dispatch({ type: "FILL_SLOT", slotId });
          }}
        />
        <div className="draft-screen__side">
          <ChemistryMeter score={chemistryScore} />
          <ComboReveal
            combo={state.currentCombo}
            teamName={teamName}
            onSpin={() => void handleSpin()}
            spinReel={spinReel}
          />
          {spinError && <p className="draft-screen__error">{spinError}</p>}
          {state.phase === "drafting" && (
            <>
              {!canAct && (
                <button
                  type="button"
                  className="reveal-skip-button"
                  onClick={() => dispatch({ type: "PASS_TURN" })}
                >
                  No eligible players — pass
                </button>
              )}
              <div className="draft-screen__squad">
                {available.map((player) => {
                  const positionTaken =
                    openSlotsFor(player, activeFormation, activePlayers).length === 0;
                  return (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      isSelected={player.id === state.selectedPlayerId}
                      onTap={() => dispatch({ type: "SELECT_PLAYER", playerId: player.id })}
                      disabled={positionTaken}
                    />
                  );
                })}
              </div>
            </>
          )}
          <button
            type="button"
            className="formation-picker__back"
            onClick={() => dispatch({ type: "RESET" })}
          >
            Restart this duel
          </button>
        </div>
      </div>
    </div>
  );
}
