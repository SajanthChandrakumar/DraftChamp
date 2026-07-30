export function ComboReveal({ combo, teamName, onSpin }) {
  if (!combo) {
    return (
      <div className="combo-reveal">
        <button type="button" className="combo-reveal__spin" onClick={onSpin}>
          Spin the club
        </button>
      </div>
    );
  }

  return (
    <div className="combo-reveal combo-reveal--set">
      <span className="combo-reveal__eyebrow">On the clock</span>
      <div className="combo-reveal__combo">
        {teamName ?? combo.team} <span className="combo-reveal__season">{combo.season}</span>
      </div>
    </div>
  );
}
