import { useMemo, useState } from "react";
import { api } from "../api/client";
import type { Player } from "../api/types";
import { hasUsablePick, openSlotsFor, pickRandomCombo } from "../game/eligibility";
import { useGameData } from "../game/GameDataContext";
import { ComboReveal } from "../components/ComboReveal";
import { Pitch } from "../components/Pitch";
import { PlayerCard } from "../components/PlayerCard";
import { RoundIndicator } from "../components/RoundIndicator";
import { playersOf, useDraftDispatch, useDraftState } from "../state/draftContext";

const EMPTY_SQUAD: Player[] = [];

export function DraftScreen() {
  const { league, posToFam } = useGameData();
  const state = useDraftState();
  const dispatch = useDraftDispatch();
  const [moveFromSlotId, setMoveFromSlotId] = useState<string | null>(null);
  const [spinError, setSpinError] = useState<string | null>(null);

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
    if (!selectedPlayer || !state.formation) return new Set<string>();
    return new Set(
      openSlotsFor(selectedPlayer, state.formation, filledPlayers, posToFam).map((s) => s.id)
    );
  }, [selectedPlayer, state.formation, filledPlayers, posToFam]);

  // Peak XI restricts the spin pool to the chosen club's own seasons.
  const comboPool = useMemo(
    () =>
      state.peakClubCode
        ? league.combos.filter((c) => c.team === state.peakClubCode)
        : league.combos,
    [league.combos, state.peakClubCode]
  );

  const remainingBudget = state.budgetCap != null ? state.budgetCap - state.budgetSpent : null;

  const canAct = useMemo(() => {
    if (!state.formation || state.phase !== "drafting") return true;
    return hasUsablePick(available, state.formation, filledPlayers, posToFam, remainingBudget);
  }, [available, state.formation, filledPlayers, posToFam, remainingBudget, state.phase]);

  const handleSpin = async () => {
    setSpinError(null);
    try {
      const combo = pickRandomCombo(comboPool);
      const squadResponse = await api.squad(combo.team, combo.season);
      dispatch({ type: "SPIN_COMBO", combo, squad: squadResponse.players });
    } catch {
      setSpinError("Could not load that squad — try spinning again.");
    }
  };

  const handleSelectPlayer = (playerId: number) => {
    setMoveFromSlotId(null);
    dispatch({ type: "SELECT_PLAYER", playerId });
  };

  const handleSlotTap = (slotId: string) => {
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
    ? (league.teams.find((t) => t.code === state.currentCombo!.team)?.name ?? state.currentCombo.team)
    : null;

  return (
    <div className="draft-screen">
      {remainingBudget != null && (
        <div className="draft-screen__banner draft-screen__banner--budget">
          Budget remaining: €{(remainingBudget / 1_000_000).toFixed(1)}M / €
          {(state.budgetCap! / 1_000_000).toFixed(1)}M
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
          <ComboReveal
            combo={state.currentCombo}
            teamName={teamName}
            onSpin={() => void handleSpin()}
          />
          {spinError && <p className="draft-screen__error">{spinError}</p>}
          {state.phase === "drafting" && !canAct && (
            <button type="button" className="reveal-skip-button" onClick={() => void handleSpin()}>
              No usable pick in this reveal — spin again
            </button>
          )}
          {state.phase === "drafting" && (
            <div className="draft-screen__squad">
              {available.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSelected={player.id === state.selectedPlayerId}
                  onTap={() => handleSelectPlayer(player.id)}
                  cost={remainingBudget != null ? (player.marketValue ?? 0) : undefined}
                  disabled={
                    remainingBudget != null && (player.marketValue ?? 0) > remainingBudget
                  }
                />
              ))}
            </div>
          )}
          <button
            type="button"
            className="formation-picker__back"
            onClick={() => dispatch({ type: "RESET" })}
          >
            Restart this draft
          </button>
        </div>
      </div>
    </div>
  );
}
