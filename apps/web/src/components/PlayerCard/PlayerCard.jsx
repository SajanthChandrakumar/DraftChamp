import { useRef } from "react";

const ATTR_LABELS = [
  ["pace", "PAC"],
  ["shooting", "SHO"],
  ["passing", "PAS"],
  ["dribbling", "DRI"],
  ["defending", "DEF"],
  ["physical", "PHY"],
];

// Trading-card rarity tiers. The real dataset's ceiling is ~91 overall, so
// "legendary" is genuinely rare — a handful of players per squad at most.
function ratingTier(overall) {
  if (overall >= 85) return "legendary";
  if (overall >= 80) return "elite";
  if (overall >= 75) return "solid";
  return "standard";
}

function formatCost(value) {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value}`;
}

export function PlayerCard({ player, isSelected, onTap, cost, disabled = false }) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--tilt-x", `${(0.5 - py) * 14}deg`);
    el.style.setProperty("--tilt-y", `${(px - 0.5) * 14}deg`);
    el.style.setProperty("--glow-x", `${px * 100}%`);
    el.style.setProperty("--glow-y", `${py * 100}%`);
  };

  const resetTilt = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <button
      ref={ref}
      type="button"
      className={`player-card player-card--${ratingTier(player.overall)}${isSelected ? " player-card--selected" : ""}`}
      onClick={onTap}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      disabled={disabled}
    >
      <span className="player-card__shine" aria-hidden="true" />
      <div className="player-card__header">
        <span className="player-card__overall">{player.overall}</span>
        <span className="player-card__positions">{player.positions.join(" / ")}</span>
      </div>
      <div className="player-card__name">{player.name}</div>
      {cost != null && <div className="player-card__cost">{formatCost(cost)}</div>}
      <dl className="player-card__attrs">
        {ATTR_LABELS.map(([key, label]) => (
          <div className="player-card__attr" key={key}>
            <dt>{label}</dt>
            <dd>{player.attributes[key]}</dd>
          </div>
        ))}
      </dl>
    </button>
  );
}
