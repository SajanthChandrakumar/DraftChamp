import { useEffect, useState } from "react";

const ITEM_HEIGHT = 40; // px — must match .combo-reel-item height in App.css

export function ComboReveal({ combo, teamName, onSpin, spinReel }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!spinReel) {
      setOffset(0);
      return undefined;
    }
    setOffset(0);
    const raf = requestAnimationFrame(() => {
      setOffset((spinReel.length - 1) * ITEM_HEIGHT);
    });
    return () => cancelAnimationFrame(raf);
  }, [spinReel]);

  if (spinReel) {
    return (
      <div className="combo-reveal combo-reveal--spinning">
        <span className="combo-reveal__eyebrow">Spinning…</span>
        <div className="combo-reel-viewport">
          <div className="combo-reel-track" style={{ transform: `translateY(-${offset}px)` }}>
            {spinReel.map((label, i) => (
              <div className="combo-reel-item" key={i}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
      <div className="combo-reveal__combo combo-reveal__combo--landed">
        {teamName ?? combo.team} <span className="combo-reveal__season">{combo.season}</span>
      </div>
    </div>
  );
}
