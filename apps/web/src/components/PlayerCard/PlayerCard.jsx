const ATTR_LABELS = [
  ["pace", "PAC"],
  ["shooting", "SHO"],
  ["passing", "PAS"],
  ["dribbling", "DRI"],
  ["defending", "DEF"],
  ["physical", "PHY"],
];

function formatCost(value) {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value}`;
}

export function PlayerCard({ player, isSelected, onTap, cost, disabled = false }) {
  return (
    <button
      type="button"
      className={`player-card${isSelected ? " player-card--selected" : ""}`}
      onClick={onTap}
      disabled={disabled}
    >
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
