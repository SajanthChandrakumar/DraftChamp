import type { Player } from "../../leagues/types";
import { FORMATIONS, type FormationId, type SlotId } from "../../engine/formations";
import { SlotMarker } from "../SlotMarker";

export interface PitchProps {
  formationId: FormationId;
  filledSlots: Record<SlotId, Player>;
  eligibleSlotIds: Set<SlotId>;
  onSlotTap: (slotId: SlotId) => void;
}

export function Pitch({ formationId, filledSlots, eligibleSlotIds, onSlotTap }: PitchProps) {
  return (
    <div className="pitch">
      {FORMATIONS[formationId].map((slot) => (
        <SlotMarker
          key={slot.id}
          slot={slot}
          player={filledSlots[slot.id]}
          isEligible={eligibleSlotIds.has(slot.id)}
          onTap={() => onSlotTap(slot.id)}
        />
      ))}
    </div>
  );
}
