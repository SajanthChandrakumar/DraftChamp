import type { Player } from "../../leagues/types";

export interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onTap: () => void;
}

export function PlayerCard({ player, isSelected, onTap }: PlayerCardProps) {
  return (
    <button
      type="button"
      className={`player-card${isSelected ? " player-card--selected" : ""}`}
      onClick={onTap}
    >
      <div className="player-card__header">
        <span className="player-card__overall">{player.overall}</span>
        <span className="player-card__positions">{player.positions.join("/")}</span>
      </div>
      <div className="player-card__name">{player.name}</div>
      <div className="player-card__attrs">
        <span>PAC {player.attributes.pace}</span>
        <span>SHO {player.attributes.shooting}</span>
        <span>PAS {player.attributes.passing}</span>
        <span>DRI {player.attributes.dribbling}</span>
        <span>DEF {player.attributes.defending}</span>
        <span>PHY {player.attributes.physical}</span>
      </div>
    </button>
  );
}
