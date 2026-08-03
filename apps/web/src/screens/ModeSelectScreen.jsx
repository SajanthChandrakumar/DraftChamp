import { useGameData } from "../game/GameDataContext";

export function ModeSelectScreen({ onSelect, onShowHistory }) {
  const { modes, records } = useGameData();

  return (
    <div className="mode-select">
      <div className="mode-select__hero">
        <span className="mode-select__eyebrow">{records.length} Premier League records on the line</span>
        <h1 className="mode-select__title">Build an XI.</h1>
        <p className="mode-select__intro">
          Spin a club-season, draft your eleven, then find out which Premier League records your
          squad broke.
        </p>
      </div>
      <div className="mode-select__options">
        {modes.map((mode, i) => (
          <button
            key={mode.id}
            type="button"
            className="mode-select__option"
            onClick={() => onSelect(mode.id)}
          >
            <span className="mode-select__option-index" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="mode-select__option-label">{mode.label}</span>
            <span className="mode-select__option-description">{mode.description}</span>
          </button>
        ))}
      </div>
      <button type="button" className="mode-select__history" onClick={onShowHistory}>
        View draft history
      </button>
    </div>
  );
}
