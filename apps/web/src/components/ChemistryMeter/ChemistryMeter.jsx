export function ChemistryMeter({ score }) {
  const onTrack = score >= 50;

  return (
    <div className={`rating-scaler chemistry-meter${onTrack ? " rating-scaler--ontrack" : ""}`}>
      <div className="rating-scaler__header">
        <span className="rating-scaler__label">Squad chemistry</span>
        <span className="rating-scaler__reading">{score}/100</span>
      </div>
      <div className="rating-scaler__track">
        <div
          className={`rating-scaler__fill${onTrack ? " rating-scaler__fill--ontrack" : ""}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
