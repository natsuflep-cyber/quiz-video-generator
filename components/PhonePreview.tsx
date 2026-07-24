"use client";

import { RefObject } from "react";
import { RenderProgress } from "@/lib/types";

interface PhonePreviewProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  videoUrl: string | null;
  progress: RenderProgress;
  fileExtension: string;
  quizTitle: string;
}

export default function PhonePreview({
  canvasRef,
  videoUrl,
  progress,
  fileExtension,
  quizTitle,
}: PhonePreviewProps) {
  const isRendering = progress.phase === "loading-audio" || progress.phase === "rendering";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-[300px] mx-auto rounded-[2.5rem] overflow-hidden phone-frame bg-black">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
          style={{ display: videoUrl ? "none" : "block" }}
        />
        {videoUrl && (
          <video
            src={videoUrl}
            controls
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {isRendering && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-10 h-10 border-4 border-white/20 border-t-accent rounded-full animate-spin" />
            <p className="text-white text-sm font-medium">{progress.message}</p>
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-200"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {progress.phase === "error" && (
        <p className="text-quiz-red text-sm text-center max-w-xs">{progress.message}</p>
      )}

      {videoUrl && (
        <a
          href={videoUrl}
          download={`quiz-${slugify(quizTitle)}.${fileExtension}`}
          className="w-full max-w-[300px] text-center rounded-2xl bg-quiz-green hover:brightness-110 transition-all duration-200 py-4 font-display font-bold text-lg text-quiz-ink shadow-lg"
        >
          ⬇️ BAIXAR VÍDEO (.{fileExtension.toUpperCase()})
        </a>
      )}
    </div>
  );
}

function slugify(text: string): string {
  const base = text.trim().toLowerCase() || "video";
  return base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
