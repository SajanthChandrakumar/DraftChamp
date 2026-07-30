import type { Player } from "../leagues/types";
import type { SeasonRecord } from "../engine/simulation";

const CANVAS_SIZE = 1080;

const PITCH_BG = "#0d1f16";
const CHALK = "#f3f1e7";
const CHALK_MUTED = "#9fb8a8";
const BRASS = "#c8922f";

function findPlayer(filledSlots: Record<string, Player>, id: number): Player | undefined {
  return Object.values(filledSlots).find((p) => p.id === id);
}

/** Draws the shareable result card, matching the app's pitch-and-brass palette. */
export function renderResultCanvas(
  record: SeasonRecord,
  filledSlots: Record<string, Player>
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = PITCH_BG;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.textAlign = "center";

  ctx.fillStyle = BRASS;
  ctx.font = "700 22px 'Public Sans', sans-serif";
  ctx.fillText("DRAFTCHAMP", CANVAS_SIZE / 2, 110);

  ctx.fillStyle = CHALK;
  ctx.font = "700 64px 'Big Shoulders Display', sans-serif";
  ctx.fillText(record.tier, CANVAS_SIZE / 2, 200);

  ctx.font = "700 52px 'Big Shoulders Display', sans-serif";
  ctx.fillText(`${record.wins}-${record.draws}-${record.losses}`, CANVAS_SIZE / 2, 330);

  ctx.fillStyle = CHALK_MUTED;
  ctx.font = "600 30px 'Public Sans', sans-serif";
  ctx.fillText(`${record.points} pts · P${record.leaguePosition}`, CANVAS_SIZE / 2, 390);

  const topPlayer = findPlayer(filledSlots, record.topPlayerId);
  const topScorer = findPlayer(filledSlots, record.topScorerId);
  ctx.fillStyle = CHALK;
  ctx.font = "600 28px 'Public Sans', sans-serif";
  if (topPlayer) ctx.fillText(`Top player: ${topPlayer.name}`, CANVAS_SIZE / 2, 470);
  if (topScorer) ctx.fillText(`Top scorer: ${topScorer.name}`, CANVAS_SIZE / 2, 510);

  ctx.fillStyle = CHALK_MUTED;
  ctx.font = "400 26px 'Public Sans', sans-serif";
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
