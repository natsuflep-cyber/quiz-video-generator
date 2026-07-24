import { QuizInput, RenderProgress } from "./types";
import {
  fetchNarrationBuffer,
  estimateSpeechDuration,
  playBufferAt,
  scheduleCountdownTicks,
  pickSupportedMimeType,
} from "./audioEngine";
import { CANVAS_WIDTH, CANVAS_HEIGHT, drawFrame, Timeline } from "./canvasDraw";

function buildIntroText(quiz: QuizInput): string {
  const question = quiz.question.trim().replace(/[?!]+$/, "");
  return `${question}? Opção A: ${quiz.optionA}. Opção B: ${quiz.optionB}. Você tem cinco segundos para responder.`;
}

function buildRevealText(quiz: QuizInput): string {
  const correct = quiz.correct === "A" ? quiz.optionA : quiz.optionB;
  return `A resposta certa é: ${correct}!`;
}

function waitFrames(
  canvas: HTMLCanvasElement,
  quiz: QuizInput,
  timeline: Timeline,
  onProgress: (p: RenderProgress) => void
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas 2D não suportado."));

  return new Promise((resolve) => {
    const start = performance.now();
    const totalMs = timeline.totalDuration * 1000;

    function tick(now: number) {
      const elapsedS = (now - start) / 1000;
      drawFrame(ctx!, quiz, elapsedS, timeline);

      const percent = Math.min(95, 15 + (elapsedS / timeline.totalDuration) * 80);
      onProgress({
        phase: "rendering",
        message: "Renderizando vídeo...",
        percent,
      });

      if (now - start < totalMs) {
        requestAnimationFrame(tick);
      } else {
        drawFrame(ctx!, quiz, timeline.totalDuration, timeline);
        resolve();
      }
    }
    requestAnimationFrame(tick);
  });
}

export async function generateQuizVideo(
  quiz: QuizInput,
  canvas: HTMLCanvasElement,
  onProgress: (p: RenderProgress) => void
): Promise<{ blob: Blob; mimeType: string }> {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  onProgress({ phase: "loading-audio", message: "Gerando narração em português...", percent: 5 });

  const AudioContextCtor =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextCtor();
  const destination = audioCtx.createMediaStreamDestination();

  const introText = buildIntroText(quiz);
  const revealText = buildRevealText(quiz);

  const [introBuffer, revealBuffer] = await Promise.all([
    fetchNarrationBuffer(introText, audioCtx),
    fetchNarrationBuffer(revealText, audioCtx),
  ]);

  const introDuration = introBuffer ? introBuffer.duration + 0.4 : estimateSpeechDuration(introText);
  const revealDuration = revealBuffer ? revealBuffer.duration + 0.6 : estimateSpeechDuration(revealText) + 0.6;
  const countdownDuration = 5;
  const totalDuration = introDuration + countdownDuration + revealDuration;

  const timeline: Timeline = { introDuration, countdownDuration, revealDuration, totalDuration };

  onProgress({ phase: "rendering", message: "Preparando gravação...", percent: 12 });

  const videoStream = (canvas as HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream }).captureStream(30);
  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...destination.stream.getAudioTracks(),
  ]);

  const mimeType = pickSupportedMimeType();
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingDone = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  recorder.start(250);

  const startTime = audioCtx.currentTime + 0.15;
  if (introBuffer) playBufferAt(audioCtx, introBuffer, destination, startTime);
  scheduleCountdownTicks(audioCtx, destination, startTime + introDuration, countdownDuration);
  if (revealBuffer) {
    playBufferAt(audioCtx, revealBuffer, destination, startTime + introDuration + countdownDuration);
  }

  await waitFrames(canvas, quiz, timeline, onProgress);

  recorder.stop();
  const blob = await recordingDone;

  audioCtx.close();

  onProgress({ phase: "done", message: "Vídeo pronto!", percent: 100 });

  return { blob, mimeType };
}

export function extensionForMimeType(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}
