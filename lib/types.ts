export type OptionKey = "A" | "B";

export interface QuizInput {
  question: string;
  optionA: string;
  optionB: string;
  correct: OptionKey;
}

export type RenderPhase = "idle" | "loading-audio" | "rendering" | "done" | "error";

export interface RenderProgress {
  phase: RenderPhase;
  message: string;
  percent: number;
}
