import { SlotMarker } from "../SlotMarker";

export function Pitch({ formation, filledSlots, eligibleSlotIds, onSlotTap }) {
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
