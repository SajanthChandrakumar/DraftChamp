export interface RoundIndicatorProps {
  round: number;
  totalRounds?: number;
}

export function RoundIndicator({ round, totalRounds = 11 }: RoundIndicatorProps) {
  return (
    <div className="round-indicator">
      Pick {Math.min(round, totalRounds)} of {totalRounds}
    </div>
  );
}
