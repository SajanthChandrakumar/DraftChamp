import { useMemo, useState } from "react";
import { api } from "../api/client";
import { hasUsablePick, openSlotsFor, pickRandomCombo } from "../game/eligibility";
import { useGameData } from "../game/GameDataContext";
import { buildSpinReel } from "../game/spin";
import { computeDraftStrength } from "../game/strength";
import { ComboReveal } from "../components/ComboReveal";
import { Pitch } from "../components/Pitch";
import { PlayerCard } from "../components/PlayerCard";
import { RatingScaler } from "../components/RatingScaler";
import { RoundIndicator } from "../components/RoundIndicator";
import {
  nextScriptedCombo,
  playersOf,
  useDraftDispatch,
  useDraftState,
} from "../state/draftContext";

const EMPTY_SQUAD = [];
const SPIN_MIN_MS = 900;

export function DraftScreen() {
  const { league, records } = useGameData();
  const state = useDraftState();
  const dispatch = useDraftDispatch();
  const [moveFromSlotId, setMoveFromSlotId] = useState(null);
  const [spinError, setSpinError] = useState(null);
  const [spinReel, setSpinReel] = useState(null);

  const squad = state.currentSquad ?? EMPTY_SQUAD;
  const filledPlayers = useMemo(() => playersOf(state.filled), [state.filled]);

  const available = useMemo(
    () => squad.filter((p) => !state.usedPlayerIds.has(p.id)),
    [squad, state.usedPlayerIds]
  );

  const selectedPlayer =
    available.find((p) => p.id === state.selectedPlayerId) ??
    Object.values(state.filled).find((e) => e.player.id === state.selectedPlayerId)?.player ??
    null;

  const eligibleSlotIds = useMemo(() => {
    if (!selectedPlayer || !state.formation) return new Set();
    return new Set(
      openSlotsFor(selectedPlayer, state.formation, filledPlayers).map((s) => s.id)
    );
  }, [selectedPlayer, state.formation, filledPlayers]);

  // Peak XI restricts the spin pool to the chosen club's own seasons.
  const comboPool = useMemo(
    () =>
      state.peakClubCode
        ? league.combos.filter((c) => c.team === state.peakClubCode)
        : league.combos,
    [league.combos, state.peakClubCode]
  );

  const remainingBudget = state.budgetCap != null ? state.budgetCap - state.budgetSpent : null;

  const draftStrength = useMemo(
    () => computeDraftStrength(state.filled, state.formation),
    [state.filled, state.formation]
  );
  // Top-scorer tracks the same attack rating as most-scored, just at a lower
  // bar — showing it alongside the rest would just duplicate that bar, so
  // it's evaluated at the end like every other record but left off this list.
  const trackedRecords = useMemo(
    () => records.filter((r) => r.id !== "top-scorer"),
    [records]
  );

  const canAct = useMemo(() => {
    if (!state.formation || state.phase !== "drafting") return true;
    return hasUsablePick(available, state.formation, filledPlayers, remainingBudget);
  }, [available, state.formation, filledPlayers, remainingBudget, state.phase]);

  const handleSpin = async () => {
    setSpinError(null);

    // Daily Draft follows a fixed script; every other mode spins at random.
    const combo = nextScriptedCombo(state) ?? pickRandomCombo(comboPool);
    const labelFor = (c) => `${league.teams.find((t) => t.code === c.team)?.name ?? c.team} ${c.season}`;
    setSpinReel(buildSpinReel(comboPool.map(labelFor), labelFor(combo)));

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

  const handleSelectPlayer = (playerId) => {
    setMoveFromSlotId(null);
    dispatch({ type: "SELECT_PLAYER", playerId });
  };

  const handleSlotTap = (slotId) => {
    const occupant = state.filled[slotId];

    if (occupant) {
      if (moveFromSlotId === slotId) {
        setMoveFromSlotId(null);
        dispatch({ type: "SELECT_PLAYER", playerId: null });
      } else {
        setMoveFromSlotId(slotId);
        dispatch({ type: "SELECT_PLAYER", playerId: occupant.player.id });
      }
      return;
    }

    if (!eligibleSlotIds.has(slotId)) return;

    if (moveFromSlotId) {
      dispatch({ type: "MOVE_PLAYER", fromSlotId: moveFromSlotId, toSlotId: slotId });
      setMoveFromSlotId(null);
    } else {
      dispatch({ type: "FILL_SLOT", slotId });
    }
  };

  if (!state.formation) return null;

  const teamName = state.currentCombo
    ? (league.teams.find((t) => t.code === state.currentCombo.team)?.name ?? state.currentCombo.team)
    : null;

  return (
    <div className="draft-screen">
      {remainingBudget != null && (
        <div className="draft-screen__banner draft-screen__banner--budget">
          Budget remaining: €{(remainingBudget / 1_000_000).toFixed(1)}M / €
          {(state.budgetCap / 1_000_000).toFixed(1)}M
        </div>
      )}
      <div className="draft-screen__board">
        <Pitch
          formation={state.formation}
          filledSlots={filledPlayers}
          eligibleSlotIds={eligibleSlotIds}
          onSlotTap={handleSlotTap}
        />
        <div className="draft-screen__side">
          <RoundIndicator round={state.round} totalRounds={state.formation.slots.length} />
          <div className="record-progress">
            <span className="record-progress__label">Record progress</span>
            {trackedRecords.map((r) => (
              <RatingScaler key={r.id} record={r} currentStrength={draftStrength[r.strengthGroup]} />
            ))}
          </div>
          <ComboReveal
            combo={state.currentCombo}
            teamName={teamName}
            onSpin={() => void handleSpin()}
            spinReel={spinReel}
          />
          {spinError && <p className="draft-screen__error">{spinError}</p>}
          {state.phase === "drafting" && !canAct && (
            <button type="button" className="reveal-skip-button" onClick={() => void handleSpin()}>
              No usable pick in this reveal — spin again
            </button>
          )}
          {state.phase === "drafting" && (
            <div className="draft-screen__squad">
              {available.map((player) => {
                const overBudget =
                  remainingBudget != null && (player.marketValue ?? 0) > remainingBudget;
                const positionTaken =
                  openSlotsFor(player, state.formation, filledPlayers).length === 0;
                return (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isSelected={player.id === state.selectedPlayerId}
                    onTap={() => handleSelectPlayer(player.id)}
                    cost={remainingBudget != null ? (player.marketValue ?? 0) : undefined}
                    disabled={overBudget || positionTaken}
                  />
                );
              })}
            </div>
          )}
          {/* The Daily is one attempt at one shared puzzle — restarting it
              would defeat the point, so that way out is only offered
              in the modes you can replay freely. */}
          {state.mode !== "daily" && (
            <button
              type="button"
              className="formation-picker__back"
              onClick={() => dispatch({ type: "RESET" })}
            >
              Restart this draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
