export function Brand({ size = "md" }) {
  return (
    <span className={`brand brand--${size}`}>
      <svg className="brand__crest" viewBox="0 0 48 56" aria-hidden="true">
        <path
          d="M24 2 L44 9 V27 C44 41 35.5 49.5 24 54 C12.5 49.5 4 41 4 27 V9 Z"
          className="brand__crest-shield"
        />
        <path d="M4 22 H44 M4 34 H44" className="brand__crest-lines" />
        <text x="24" y="32" textAnchor="middle" className="brand__crest-text">
          DC
        </text>
      </svg>
      <span className="brand__word">DraftChamp</span>
    </span>
  );
}
