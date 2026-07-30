import { useMemo } from "react";
import type { LeagueData, Player } from "../leagues/types";
import { availablePlayers, pickCombo, resolveSquad } from "../engine/draft";
import { openSlotsFor } from "../engine/formations";
import type { SlotId } from "../engine/formations";
import { ComboReveal } from "../components/ComboReveal";
import { Pitch } from "../components/Pitch";
import { PlayerCard } from "../components/PlayerCard";
import { useDuelDispatch, useDuelState } from "../state/duelContext";

export interface DuelDraftScreenProps {
  leagueData: LeagueData;
}

const EMPTY_SQUAD: Player[] = [];

export function DuelDraftScreen({ leagueData }: DuelDraftScreenProps) {
  const state = useDuelState();
  const dispatch = useDuelDispatch();

  const activeFormationId = state.turn === "A" ? state.formationA : state.formationB;
  const activeFilledSlots = state.turn === "A" ? state.filledSlotsA : state.filledSlotsB;

  const squad = state.currentSquad ?? EMPTY_SQUAD;
  const available = useMemo(
    () => availablePlayers(squad, state.usedPlayerIds),
    [squad, state.usedPlayerIds]
  );

  const selectedPlayer = available.find((p) => p.id === state.selectedPlayerId) ?? null;

  const eligibleSlotIds = useMemo(() => {
    if (!selectedPlayer || !activeFormationId) return new Set<SlotId>();
    return new Set(openSlotsFor(selectedPlayer, activeFormationId, activeFilledSlots).map((s) => s.id));
  }, [selectedPlayer, activeFormationId, activeFilledSlots]);

  const canAct = useMemo(() => {
    if (!activeFormationId || available.length === 0) return false;
    return available.some((p) => openSlotsFor(p, activeFormationId, activeFilledSlots).length > 0);
  }, [available, activeFormationId, activeFilledSlots]);

  const handleSpin = () => {
    const combo = pickCombo(leagueData.combos, Math.random);
    const squadForCombo = resolveSquad(leagueData, combo);
    dispatch({ type: "SPIN_COMBO", combo, squad: squadForCombo });
  };

  const handleSlotTap = (slotId: SlotId) => {
    if (!eligibleSlotIds.has(slotId)) return;
    dispatch({ type: "FILL_SLOT", slotId });
  };

  if (!activeFormationId) return null;

  const teamName = state.currentCombo ? leagueData.teams[state.currentCombo[0]]?.name ?? null : null;
  const filledCountA = Object.keys(state.filledSlotsA).length;
  const filledCountB = Object.keys(state.filledSlotsB).length;

  return (
    <div className="draft-screen">
      <div className="duel-turn-banner">
        <span className={`duel-turn-banner__side duel-turn-banner__side--${state.turn.toLowerCase()}`}>
          Player {state.turn}'s pick
        </span>
        <span className="duel-turn-banner__scores">
          A: {filledCountA}/11 &middot; B: {filledCountB}/11
        </span>
      </div>
      <div className="draft-screen__board">
        <Pitch
          formationId={activeFormationId}
          filledSlots={activeFilledSlots}
          eligibleSlotIds={eligibleSlotIds}
          onSlotTap={handleSlotTap}
        />
        <div className="draft-screen__side">
          <ComboReveal combo={state.currentCombo} teamName={teamName} onSpin={handleSpin} />
          {state.phase === "drafting" && (
            <>
              {!canAct && (
                <button type="button" className="reveal-skip-button" onClick={() => dispatch({ type: "PASS_TURN" })}>
                  No eligible players — pass
                </button>
              )}
              <div className="draft-screen__squad">
                {available.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isSelected={player.id === state.selectedPlayerId}
                    onTap={() => dispatch({ type: "SELECT_PLAYER", playerId: player.id })}
                  />
                ))}
              </div>
            </>
          )}
          <button type="button" className="formation-picker__back" onClick={() => dispatch({ type: "RESET" })}>
            Restart this duel
          </button>
        </div>
      </div>
    </div>
  );
}
