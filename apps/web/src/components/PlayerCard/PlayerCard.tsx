import type { Player } from "../../api/types";

export interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onTap: () => void;
  /** Shown as a cost line when the active mode has a budget (e.g. Budget Draft). */
  cost?: number;
  disabled?: boolean;
}

const ATTR_LABELS: [key: keyof Player["attributes"], label: string][] = [
  ["pace", "PAC"],
  ["shooting", "SHO"],
  ["passing", "PAS"],
  ["dribbling", "DRI"],
  ["defending", "DEF"],
  ["physical", "PHY"],
];

function formatCost(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value}`;
}

export function PlayerCard({ player, isSelected, onTap, cost, disabled = false }: PlayerCardProps) {
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
