"use client";

import { OptionKey, QuizInput } from "@/lib/types";

interface QuizFormProps {
  quiz: QuizInput;
  onChange: (quiz: QuizInput) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function QuizForm({ quiz, onChange, onSubmit, disabled }: QuizFormProps) {
  const update = (patch: Partial<QuizInput>) => onChange({ ...quiz, ...patch });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="card p-6 md:p-8 flex flex-col gap-6"
    >
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">
          Monte seu quiz
        </h2>
        <p className="text-white/50 text-sm">
          Preencha os campos abaixo — a pré-visualização atualiza em tempo real.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-white/70">
          Pergunta
        </label>
        <textarea
          className="input-field resize-none"
          rows={3}
          placeholder="Ex: Qual planeta é o mais próximo do Sol"
          value={quiz.question}
          onChange={(e) => update({ question: e.target.value })}
          maxLength={140}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-quiz-blue flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-quiz-blue inline-block" />
            Opção A (azul)
          </label>
          <input
            className="input-field"
            placeholder="Ex: Mercúrio"
            value={quiz.optionA}
            onChange={(e) => update({ optionA: e.target.value })}
            maxLength={60}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-quiz-red flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-quiz-red inline-block" />
            Opção B (vermelha)
          </label>
          <input
            className="input-field"
            placeholder="Ex: Vênus"
            value={quiz.optionB}
            onChange={(e) => update({ optionB: e.target.value })}
            maxLength={60}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-white/70">
          Resposta correta
        </label>
        <div className="flex gap-3">
          {(["A", "B"] as OptionKey[]).map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => update({ correct: key })}
              className={`flex-1 rounded-2xl border px-4 py-3 font-semibold transition-all ${
                quiz.correct === key
                  ? "border-quiz-green bg-quiz-green/15 text-quiz-green"
                  : "border-base-700 bg-base-800 text-white/60 hover:border-white/20"
              }`}
            >
              Opção {key}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="mt-2 w-full rounded-2xl bg-accent hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 py-4 font-display font-bold text-lg text-white shadow-glow"
      >
        🚀 GERAR VÍDEO DO QUIZ
      </button>
    </form>
  );
}
