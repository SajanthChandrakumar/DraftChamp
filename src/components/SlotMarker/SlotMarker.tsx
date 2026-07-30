import type { Player } from "../../leagues/types";
import type { FormationSlot } from "../../engine/formations";

export interface SlotMarkerProps {
  slot: FormationSlot;
  player?: Player;
  isEligible: boolean;
  onTap: () => void;
}

export function SlotMarker({ slot, player, isEligible, onTap }: SlotMarkerProps) {
  const filled = !!player;
  const classes = [
    "slot-marker",
    filled ? "slot-marker--filled" : "slot-marker--empty",
    isEligible && !filled ? "slot-marker--eligible" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      onClick={onTap}
      disabled={!filled && !isEligible}
    >
      {filled ? (
        <span className="slot-marker__player">{player.name}</span>
      ) : (
        <span className="slot-marker__label">{slot.label}</span>
      )}
    </button>
  );
}
