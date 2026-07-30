function surname(fullName) {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

export function SlotMarker({ slot, player, isEligible, onTap }) {
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
      title={filled ? `${player.name} (${player.overall} OVR)` : slot.label}
    >
      <span className="slot-marker__badge">{filled ? (player.shirtNumber ?? "–") : slot.label}</span>
      {filled && <span className="slot-marker__tag">{surname(player.name)}</span>}
    </button>
  );
}
