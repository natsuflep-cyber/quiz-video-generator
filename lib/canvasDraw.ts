import { QuizInput } from "./types";

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

export interface Timeline {
  introDuration: number;
  countdownDuration: number;
  revealDuration: number;
  totalDuration: number;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawCenteredWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  lineHeight: number
) {
  const lines = wrapLines(ctx, text, maxWidth);
  const totalHeight = lines.length * lineHeight;
  const startY = centerY - totalHeight / 2 + lineHeight / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, centerX, startY + i * lineHeight);
  });
}

function ensureQuestionMark(question: string): string {
  const trimmed = question.trim();
  if (!trimmed) return trimmed;
  return /[?!]$/.test(trimmed) ? trimmed : `${trimmed}?`;
}

function drawOptionBox(
  ctx: CanvasRenderingContext2D,
  label: string,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  highlighted: boolean
) {
  ctx.save();
  if (highlighted) {
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 30;
  }
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 36);
  ctx.fill();

  if (highlighted) {
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#0B0D12";
    roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 32);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "700 56px Arial, sans-serif";
  ctx.fillText(label, x + 90, y + h / 2);

  ctx.font = "600 52px Arial, sans-serif";
  drawCenteredWrappedText(ctx, text, x + w / 2 + 60, y + h / 2, w - 260, 62);
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  quiz: QuizInput,
  t: number,
  timeline: Timeline
) {
  const { introDuration, countdownDuration } = timeline;

  // Fundo amarelo sólido
  ctx.fillStyle = "#FFDF00";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Pergunta (texto preto, topo)
  ctx.fillStyle = "#0B0D12";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 76px Arial, sans-serif";
  drawCenteredWrappedText(
    ctx,
    ensureQuestionMark(quiz.question || "Sua pergunta aqui"),
    CANVAS_WIDTH / 2,
    280,
    CANVAS_WIDTH - 160,
    92
  );

  const inCountdown = t >= introDuration && t < introDuration + countdownDuration;
  const inReveal = t >= introDuration + countdownDuration;

  // Centro: contagem regressiva ou selo de resposta
  if (inCountdown) {
    const secondIndex = Math.min(
      countdownDuration - 1,
      Math.floor(t - introDuration)
    );
    const number = countdownDuration - secondIndex;
    const localT = (t - introDuration) - secondIndex; // 0..1 dentro do segundo atual
    const scale = 1 + Math.max(0, 0.35 * (1 - localT * 4)); // "pulso" no início do segundo

    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, 980);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.arc(0, 0, 220, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(11,13,18,0.08)";
    ctx.fill();

    ctx.fillStyle = "#0B0D12";
    ctx.font = "800 320px Arial, sans-serif";
    ctx.fillText(String(number), 0, 20);
    ctx.restore();
  } else if (inReveal) {
    const w = 860;
    const h = 300;
    const x = (CANVAS_WIDTH - w) / 2;
    const y = 830;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 40;
    ctx.fillStyle = "#17C964";
    roundRect(ctx, x, y, w, h, 44);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 64px Arial, sans-serif";
    drawCenteredWrappedText(ctx, "RESPOSTA CERTA ✓", CANVAS_WIDTH / 2, y + 90, w - 100, 70);

    const correctText = quiz.correct === "A" ? quiz.optionA : quiz.optionB;
    ctx.font = "700 56px Arial, sans-serif";
    drawCenteredWrappedText(ctx, correctText, CANVAS_WIDTH / 2, y + 200, w - 140, 62);
  } else {
    // Intro: mostra um "5" estático e discreto como prévia do cronômetro
    ctx.fillStyle = "rgba(11,13,18,0.12)";
    ctx.font = "800 320px Arial, sans-serif";
    ctx.fillText("5", CANVAS_WIDTH / 2, 1000);
  }

  // Caixas de opção
  const boxW = CANVAS_WIDTH - 160;
  const boxH = 190;
  const boxX = 80;

  const highlightA = inReveal && quiz.correct === "A";
  const highlightB = inReveal && quiz.correct === "B";

  drawOptionBox(
    ctx,
    "A",
    quiz.optionA || "Opção A",
    boxX,
    1350,
    boxW,
    boxH,
    "#1E5FFF",
    highlightA
  );
  drawOptionBox(
    ctx,
    "B",
    quiz.optionB || "Opção B",
    boxX,
    1580,
    boxW,
    boxH,
    "#FF3B3B",
    highlightB
  );

  // Rodapé discreto
  ctx.fillStyle = "rgba(11,13,18,0.55)";
  ctx.font = "600 34px Arial, sans-serif";
  ctx.fillText("Comenta sua resposta 👇", CANVAS_WIDTH / 2, 1830);
}
