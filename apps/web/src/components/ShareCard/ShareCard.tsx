import { useEffect, useRef } from "react";
import type { SeasonResult } from "../../api/types";
import { renderResultCanvas } from "../../utils/canvasExport";
import { shareResult } from "../../utils/share";

export interface ShareCardProps {
  season: SeasonResult;
  challengesAchieved: number;
}

export function ShareCard({ season, challengesAchieved }: ShareCardProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = renderResultCanvas(season, challengesAchieved);
    canvasRef.current = canvas;
    if (imgRef.current) imgRef.current.src = canvas.toDataURL("image/png");
  }, [season, challengesAchieved]);

  const handleShare = () => {
    if (!canvasRef.current) return;
    const text =
      `${season.tier} — ${season.wins}W ${season.draws}D ${season.losses}L, ` +
      `${challengesAchieved} record${challengesAchieved === 1 ? "" : "s"} broken`;
    void shareResult(canvasRef.current, text);
  };

  return (
    <div className="share-card">
      <img ref={imgRef} alt="Season result" className="share-card__image" />
      <button type="button" className="share-card__button" onClick={handleShare}>
        Share result
      </button>
    </div>
  );
}
