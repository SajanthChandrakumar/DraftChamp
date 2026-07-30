import type { Player } from "../../leagues/types";

export interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onTap: () => void;
}

const ATTR_LABELS: [key: keyof Player["attributes"], label: string][] = [
  ["pace", "PAC"],
  ["shooting", "SHO"],
  ["passing", "PAS"],
  ["dribbling", "DRI"],
  ["defending", "DEF"],
  ["physical", "PHY"],
];

export function PlayerCard({ player, isSelected, onTap }: PlayerCardProps) {
  return (
    <button
      type="button"
      className={`player-card${isSelected ? " player-card--selected" : ""}`}
      onClick={onTap}
    >
      <div className="player-card__header">
        <span className="player-card__overall">{player.overall}</span>
        <span className="player-card__positions">{player.positions.join(" / ")}</span>
      </div>
      <div className="player-card__name">{player.name}</div>
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
