import type { SeasonResult } from "../api/types";

const CANVAS_SIZE = 1080;

const PITCH_BG = "#0d1f16";
const CHALK = "#f3f1e7";
const CHALK_MUTED = "#9fb8a8";
const BRASS = "#c8922f";

/** Draws the shareable result card, matching the app's pitch-and-brass palette. */
export function renderResultCanvas(
  season: SeasonResult,
  challengesAchieved: number
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
  ctx.fillText(season.tier, CANVAS_SIZE / 2, 200);

  ctx.font = "700 52px 'Big Shoulders Display', sans-serif";
  ctx.fillText(`${season.wins}-${season.draws}-${season.losses}`, CANVAS_SIZE / 2, 330);

  ctx.fillStyle = CHALK_MUTED;
  ctx.font = "600 30px 'Public Sans', sans-serif";
  ctx.fillText(`${season.points} pts · P${season.leaguePosition}`, CANVAS_SIZE / 2, 390);
  ctx.fillText(
    `${season.goalsFor} scored · ${season.goalsConceded} conceded`,
    CANVAS_SIZE / 2,
    440
  );

  ctx.fillStyle = BRASS;
  ctx.font = "700 40px 'Big Shoulders Display', sans-serif";
  ctx.fillText(
    `${challengesAchieved} record${challengesAchieved === 1 ? "" : "s"} broken`,
    CANVAS_SIZE / 2,
    520
  );

  ctx.fillStyle = CHALK;
  ctx.font = "600 28px 'Public Sans', sans-serif";
  ctx.fillText(`Top player: ${season.topPlayerName}`, CANVAS_SIZE / 2, 590);
  ctx.fillText(
    `Top scorer: ${season.topScorerName} (${season.topScorerGoals})`,
    CANVAS_SIZE / 2,
    630
  );

  ctx.fillStyle = CHALK_MUTED;
  ctx.font = "400 26px 'Public Sans', sans-serif";
  wrapText(ctx, season.narrative, CANVAS_SIZE / 2, 720, CANVAS_SIZE - 160, 34);

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
