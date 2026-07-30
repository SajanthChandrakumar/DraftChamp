export function RatingScaler({ record, currentStrength }) {
  const pct = Math.max(0, Math.min(100, (currentStrength / record.requiredStrength) * 100));
  const onTrack = currentStrength >= record.requiredStrength;

  return (
    <div className={`rating-scaler${onTrack ? " rating-scaler--ontrack" : ""}`}>
      <div className="rating-scaler__header">
        <span className="rating-scaler__label">{record.label}</span>
        <span className="rating-scaler__reading">
          {currentStrength.toFixed(1)} / {record.requiredStrength.toFixed(0)}
          {onTrack && <span className="rating-scaler__check">✓</span>}
        </span>
      </div>
      <div className="rating-scaler__track">
        <div
          className={`rating-scaler__fill${onTrack ? " rating-scaler__fill--ontrack" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
