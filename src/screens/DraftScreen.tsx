import { useMemo, useState } from "react";
import type { LeagueData, Player } from "../leagues/types";
import { availablePlayers, combosForClub, pickCombo, resolveSquad } from "../engine/draft";
import { openSlotsFor } from "../engine/formations";
import type { SlotId } from "../engine/formations";
import { getRecordById } from "../engine/records";
import { ComboReveal } from "../components/ComboReveal";
import { Pitch } from "../components/Pitch";
import { PlayerCard } from "../components/PlayerCard";
import { RoundIndicator } from "../components/RoundIndicator";
import { useDraftDispatch, useDraftState } from "../state/draftContext";

export interface DraftScreenProps {
  leagueData: LeagueData;
}

const EMPTY_SQUAD: Player[] = [];

export function DraftScreen({ leagueData }: DraftScreenProps) {
  const state = useDraftState();
  const dispatch = useDraftDispatch();
  const [moveFromSlotId, setMoveFromSlotId] = useState<SlotId | null>(null);

  const squad = state.currentSquad ?? EMPTY_SQUAD;
  const available = useMemo(
    () => availablePlayers(squad, state.usedPlayerIds),
    [squad, state.usedPlayerIds]
  );

  const selectedPlayer =
    available.find((p) => p.id === state.selectedPlayerId) ??
    Object.values(state.filledSlots).find((p) => p.id === state.selectedPlayerId) ??
    null;

  const eligibleSlotIds = useMemo(() => {
    if (!selectedPlayer || !state.formationId) return new Set<SlotId>();
    return new Set(openSlotsFor(selectedPlayer, state.formationId, state.filledSlots).map((s) => s.id));
  }, [selectedPlayer, state.formationId, state.filledSlots]);

  const comboPool = useMemo(() => {
    if (state.mode === "peak-xi" && state.peakClubCode) {
      return combosForClub(leagueData, state.peakClubCode);
    }
    return leagueData.combos;
  }, [leagueData, state.mode, state.peakClubCode]);

  const remainingBudget = state.budgetCap != null ? state.budgetCap - state.budgetSpent : null;
  const targetRecord = state.targetRecordId ? getRecordById(state.targetRecordId) : null;

  const canAct = useMemo(() => {
    if (!state.formationId || state.phase !== "drafting") return true;
    return available.some((p) => {
      if (remainingBudget != null && (p.marketValue ?? 0) > remainingBudget) return false;
      return openSlotsFor(p, state.formationId!, state.filledSlots).length > 0;
    });
  }, [available, state.formationId, state.filledSlots, state.phase, remainingBudget]);

  const handleSpin = () => {
    const combo = pickCombo(comboPool, Math.random);
    const squadForCombo = resolveSquad(leagueData, combo);
    dispatch({ type: "SPIN_COMBO", combo, squad: squadForCombo });
  };

  const handleSelectPlayer = (playerId: number) => {
    setMoveFromSlotId(null);
    dispatch({ type: "SELECT_PLAYER", playerId });
  };

  const handleSlotTap = (slotId: SlotId) => {
    const occupant = state.filledSlots[slotId];

    if (occupant) {
      if (moveFromSlotId === slotId) {
        setMoveFromSlotId(null);
        dispatch({ type: "SELECT_PLAYER", playerId: null });
      } else {
        setMoveFromSlotId(slotId);
        dispatch({ type: "SELECT_PLAYER", playerId: occupant.id });
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

  if (!state.formationId) return null;

  const teamName = state.currentCombo ? leagueData.teams[state.currentCombo[0]]?.name ?? null : null;

  return (
    <div className="draft-screen">
      {targetRecord && (
        <div className="draft-screen__banner">
          Chasing: {targetRecord.label} ({targetRecord.holder}, {targetRecord.season})
        </div>
      )}
      {remainingBudget != null && (
        <div className="draft-screen__banner draft-screen__banner--budget">
          Budget remaining: €{(remainingBudget / 1_000_000).toFixed(1)}M / €
          {(state.budgetCap! / 1_000_000).toFixed(1)}M
        </div>
      )}
      <div className="draft-screen__board">
        <Pitch
          formationId={state.formationId}
          filledSlots={state.filledSlots}
          eligibleSlotIds={eligibleSlotIds}
          onSlotTap={handleSlotTap}
        />
        <div className="draft-screen__side">
          <RoundIndicator round={state.round} />
          <ComboReveal combo={state.currentCombo} teamName={teamName} onSpin={handleSpin} />
          {state.phase === "drafting" && !canAct && (
            <button type="button" className="reveal-skip-button" onClick={handleSpin}>
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
                  cost={remainingBudget != null ? player.marketValue ?? 0 : undefined}
                  disabled={remainingBudget != null && (player.marketValue ?? 0) > remainingBudget}
                />
              ))}
            </div>
          )}
          <button type="button" className="formation-picker__back" onClick={() => dispatch({ type: "RESET" })}>
            Restart this draft
          </button>
        </div>
      </div>
    </div>
  );
}
