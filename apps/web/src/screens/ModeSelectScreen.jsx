import { useGameData } from "../game/GameDataContext";

export function ModeSelectScreen({ onSelect, onShowHistory }) {
  const { modes, records } = useGameData();

  return (
    <div className="mode-select">
      <span className="mode-select__eyebrow">DraftChamp</span>
      <h1 className="mode-select__title">Build an XI</h1>
      <p className="mode-select__intro">
        Draft eleven players, then find out which of {records.length} Premier League records
        your squad broke.
      </p>
      <div className="mode-select__options">
        {modes.map((mode) => (
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
      <button type="button" className="formation-picker__back" onClick={onShowHistory}>
        View draft history
      </button>
    </div>
  );
}
