import type { Formation, Player } from "../../api/types";
import { SlotMarker } from "../SlotMarker";

export interface PitchProps {
  formation: Formation;
  filledSlots: Record<string, Player>;
  eligibleSlotIds: Set<string>;
  onSlotTap: (slotId: string) => void;
}

export function Pitch({ formation, filledSlots, eligibleSlotIds, onSlotTap }: PitchProps) {
  return (
    <div className="pitch">
      {formation.slots.map((slot) => (
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
