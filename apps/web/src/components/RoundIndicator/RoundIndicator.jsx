export function RoundIndicator({ round, totalRounds = 11 }) {
  const current = Math.min(round, totalRounds);
  return (
    <div className="round-indicator">
      <span className="round-indicator__label">
        Pick {current} / {totalRounds}
      </span>
      <div className="round-indicator__ticks">
        {Array.from({ length: totalRounds }, (_, i) => (
          <span
            key={i}
            className={`round-indicator__tick${i < current - 1 ? " round-indicator__tick--done" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
