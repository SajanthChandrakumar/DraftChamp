import type { Player } from "../leagues/types";
import type { SeasonRecord } from "../engine/simulation";

const CANVAS_SIZE = 1080;

function findPlayer(filledSlots: Record<string, Player>, id: number): Player | undefined {
  return Object.values(filledSlots).find((p) => p.id === id);
}

/** Draws a flat, asset-free shareable result card (placeholder visual design). */
export function renderResultCanvas(
  record: SeasonRecord,
  filledSlots: Record<string, Player>
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#0f1115";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.fillStyle = "#f5f5f5";
  ctx.font = "bold 56px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DraftChamp", CANVAS_SIZE / 2, 140);

  ctx.font = "bold 40px sans-serif";
  ctx.fillStyle = "#ffcc66";
  ctx.fillText(record.tier, CANVAS_SIZE / 2, 220);

  ctx.font = "48px sans-serif";
  ctx.fillStyle = "#f5f5f5";
  ctx.fillText(`${record.wins}W ${record.draws}D ${record.losses}L`, CANVAS_SIZE / 2, 340);

  ctx.font = "32px sans-serif";
  ctx.fillText(`${record.points} pts · P${record.leaguePosition}`, CANVAS_SIZE / 2, 400);

  const topPlayer = findPlayer(filledSlots, record.topPlayerId);
  const topScorer = findPlayer(filledSlots, record.topScorerId);
  ctx.font = "28px sans-serif";
  if (topPlayer) ctx.fillText(`Top player: ${topPlayer.name}`, CANVAS_SIZE / 2, 470);
  if (topScorer) ctx.fillText(`Top scorer: ${topScorer.name}`, CANVAS_SIZE / 2, 510);

  ctx.font = "26px sans-serif";
  ctx.fillStyle = "#bbbbbb";
  wrapText(ctx, record.narrative, CANVAS_SIZE / 2, 620, CANVAS_SIZE - 160, 34);

  return canvas;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}
