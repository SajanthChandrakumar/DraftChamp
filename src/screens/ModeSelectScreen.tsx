import { GAME_MODES, type GameModeId } from "../engine/modes";

export interface ModeSelectScreenProps {
  onSelect: (mode: GameModeId) => void;
}

export function ModeSelectScreen({ onSelect }: ModeSelectScreenProps) {
  return (
    <div className="mode-select">
      <span className="mode-select__eyebrow">DraftChamp</span>
      <h1 className="mode-select__title">Choose your challenge</h1>
      <div className="mode-select__options">
        {GAME_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className="mode-select__option"
            onClick={() => onSelect(mode.id)}
          >
            <span className="mode-select__option-label">{mode.label}</span>
            <span className="mode-select__option-description">{mode.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
