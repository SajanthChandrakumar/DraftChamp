import { useMemo, useState } from "react";
import type { LeagueData, Player } from "../leagues/types";
import { availablePlayers, pickCombo, resolveSquad } from "../engine/draft";
import { openSlotsFor } from "../engine/formations";
import type { SlotId } from "../engine/formations";
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

  const handleSpin = () => {
    const combo = pickCombo(leagueData.combos, Math.random);
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
      <RoundIndicator round={state.round} />
      <ComboReveal combo={state.currentCombo} teamName={teamName} onSpin={handleSpin} />
      <Pitch
        formationId={state.formationId}
        filledSlots={state.filledSlots}
        eligibleSlotIds={eligibleSlotIds}
        onSlotTap={handleSlotTap}
      />
      {state.phase === "drafting" && (
        <div className="draft-screen__squad">
          {available.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isSelected={player.id === state.selectedPlayerId}
              onTap={() => handleSelectPlayer(player.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
