"use client";

import { useEffect, useRef, useState } from "react";
import QuizForm from "@/components/QuizForm";
import PhonePreview from "@/components/PhonePreview";
import { QuizInput, RenderProgress } from "@/lib/types";
import { generateQuizVideo, extensionForMimeType } from "@/lib/videoRenderer";
import { CANVAS_WIDTH, CANVAS_HEIGHT, drawFrame } from "@/lib/canvasDraw";

const DEFAULT_QUIZ: QuizInput = {
  question: "Qual planeta é o mais próximo do Sol",
  optionA: "Mercúrio",
  optionB: "Vênus",
  correct: "A",
};

export default function HomePage() {
  const [quiz, setQuiz] = useState<QuizInput>(DEFAULT_QUIZ);
  const [progress, setProgress] = useState<RenderProgress>({
    phase: "idle",
    message: "",
    percent: 0,
  });
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileExtension, setFileExtension] = useState("mp4");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isBusy = progress.phase === "loading-audio" || progress.phase === "rendering";

  // Desenha uma prévia estática (sem gerar vídeo) sempre que os campos mudam.
  useEffect(() => {
    if (isBusy || videoUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawFrame(ctx, quiz, 0, {
      introDuration: 999,
      countdownDuration: 5,
      revealDuration: 3,
      totalDuration: 999,
    });
  }, [quiz, isBusy, videoUrl]);

  async function handleGenerate() {
    if (!quiz.question.trim() || !quiz.optionA.trim() || !quiz.optionB.trim()) {
      setProgress({
        phase: "error",
        message: "Preencha a pergunta e as duas opções antes de gerar o vídeo.",
        percent: 0,
      });
      return;
    }

    setVideoUrl(null);
    setProgress({ phase: "loading-audio", message: "Iniciando...", percent: 2 });

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas indisponível.");

      const { blob, mimeType } = await generateQuizVideo(quiz, canvas, setProgress);
      const url = URL.createObjectURL(blob);
      setFileExtension(extensionForMimeType(mimeType));
      setVideoUrl(url);
      setProgress({ phase: "done", message: "Vídeo pronto!", percent: 100 });
    } catch (err) {
      console.error(err);
      setProgress({
        phase: "error",
        message:
          "Não foi possível gerar o vídeo neste navegador. Tente novamente no Chrome ou Edge atualizados.",
        percent: 0,
      });
    }
  }

  function handleQuizChange(next: QuizInput) {
    setVideoUrl(null);
    setProgress({ phase: "idle", message: "", percent: 0 });
    setQuiz(next);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-base-800 bg-base-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center font-display font-bold text-white">
            Q
          </div>
          <div>
            <h1 className="font-display font-bold text-white leading-none">
              Quiz Video Generator
            </h1>
            <p className="text-xs text-white/40">Vídeos de quiz 9:16 prontos para o TikTok</p>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
        <QuizForm
          quiz={quiz}
          onChange={handleQuizChange}
          onSubmit={handleGenerate}
          disabled={isBusy}
        />

        <div className="lg:sticky lg:top-28">
          <PhonePreview
            canvasRef={canvasRef}
            videoUrl={videoUrl}
            progress={progress}
            fileExtension={fileExtension}
            quizTitle={quiz.question}
          />
        </div>
      </section>
    </main>
  );
}
