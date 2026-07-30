import type { Combo } from "../../leagues/types";

export interface ComboRevealProps {
  combo: Combo | null;
  teamName: string | null;
  onSpin: () => void;
}

export function ComboReveal({ combo, teamName, onSpin }: ComboRevealProps) {
  if (!combo) {
    return (
      <div className="combo-reveal">
        <button type="button" className="combo-reveal__spin" onClick={onSpin}>
          Spin the club
        </button>
      </div>
    );
  }

  const [, season] = combo;
  return (
    <div className="combo-reveal combo-reveal--set">
      <span className="combo-reveal__eyebrow">On the clock</span>
      <div className="combo-reveal__combo">
        {teamName ?? combo[0]} <span className="combo-reveal__season">{season}</span>
      </div>
    </div>
  );
}
