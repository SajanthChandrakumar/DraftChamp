import { useEffect, useRef } from "react";
import type { Player } from "../../leagues/types";
import type { SeasonRecord } from "../../engine/simulation";
import { renderResultCanvas } from "../../utils/canvasExport";
import { shareResult } from "../../utils/share";

export interface ShareCardProps {
  record: SeasonRecord;
  filledSlots: Record<string, Player>;
}

export function ShareCard({ record, filledSlots }: ShareCardProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = renderResultCanvas(record, filledSlots);
    canvasRef.current = canvas;
    if (imgRef.current) imgRef.current.src = canvas.toDataURL("image/png");
  }, [record, filledSlots]);

  const handleShare = () => {
    if (!canvasRef.current) return;
    void shareResult(canvasRef.current, `${record.tier} — ${record.wins}W ${record.draws}D ${record.losses}L`);
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
