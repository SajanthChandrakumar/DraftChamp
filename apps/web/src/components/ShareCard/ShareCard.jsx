import { useEffect, useRef } from "react";
import { buildDailyShareText } from "../../game/dailyStats";
import { renderResultCanvas } from "../../utils/canvasExport";
import { shareResult } from "../../utils/share";

export function ShareCard({ season, challengesAchieved, dailyEntry = null, streak = 0 }) {
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = renderResultCanvas(season, challengesAchieved);
    canvasRef.current = canvas;
    if (imgRef.current) imgRef.current.src = canvas.toDataURL("image/png");
  }, [season, challengesAchieved]);

  const handleShare = () => {
    if (!canvasRef.current) return;
    // Everyone plays the same daily, so its share text is the spoiler-free
    // emoji grid — safe to post. Other modes are private one-offs and can
    // describe themselves plainly.
    const text = dailyEntry
      ? buildDailyShareText(dailyEntry, streak)
      : `${season.tier} — ${season.wins}W ${season.draws}D ${season.losses}L, ` +
        `${challengesAchieved} record${challengesAchieved === 1 ? "" : "s"} broken`;
    void shareResult(canvasRef.current, text);
  };

  return (
    <div className="share-card">
      <img ref={imgRef} alt="Season result" className="share-card__image" />
      {dailyEntry && (
        <pre className="share-card__preview">{buildDailyShareText(dailyEntry, streak)}</pre>
      )}
      <button type="button" className="share-card__button" onClick={handleShare}>
        Share result
      </button>
    </div>
  );
}
