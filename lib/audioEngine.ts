// Motor de áudio: busca a narração (via /api/tts) e sintetiza o som de
// "tic-tac" localmente com a Web Audio API. Tudo é roteado para um
// MediaStreamAudioDestinationNode, cuja trilha é combinada com o vídeo
// do canvas na hora de gravar com o MediaRecorder.

export async function fetchNarrationBuffer(
  text: string,
  audioCtx: AudioContext
): Promise<AudioBuffer | null> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
  } catch {
    return null;
  }
}

// Estimativa de duração da fala quando a narração não pôde ser gerada
// (ex.: sem conexão com a API), para que o cronômetro visual continue
// sincronizado mesmo sem áudio.
export function estimateSpeechDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerSecond = 2.3; // ritmo médio de fala em pt-BR
  return Math.max(1.5, words / wordsPerSecond + 0.8);
}

export function playBufferAt(
  audioCtx: AudioContext,
  buffer: AudioBuffer,
  destination: MediaStreamAudioDestinationNode,
  when: number
) {
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;

  // Envia para a trilha que será gravada...
  source.connect(destination);
  // ...e também para as caixas de som, para o usuário acompanhar em tempo real.
  source.connect(audioCtx.destination);

  source.start(when);
  return source;
}

// Som curto e percussivo de "tique", sintetizado com um oscilador —
// não depende de nenhum arquivo de áudio externo.
function scheduleTick(
  audioCtx: AudioContext,
  destination: MediaStreamAudioDestinationNode,
  when: number,
  accent: boolean
) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "square";
  osc.frequency.value = accent ? 1600 : 1100;

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.35 : 0.22, when + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.09);

  osc.connect(gain);
  gain.connect(destination);
  gain.connect(audioCtx.destination);

  osc.start(when);
  osc.stop(when + 0.1);
}

// Agenda os 5 "tiques" da contagem regressiva, um por segundo, com um
// tique mais agudo no final para reforçar a virada.
export function scheduleCountdownTicks(
  audioCtx: AudioContext,
  destination: MediaStreamAudioDestinationNode,
  startTime: number,
  totalTicks = 5
) {
  for (let i = 0; i < totalTicks; i++) {
    scheduleTick(audioCtx, destination, startTime + i, i === totalTicks - 1);
  }
}

// Escolhe o melhor mimeType suportado pelo navegador, priorizando MP4/H.264
// (mais compatível com TikTok) e recuando para WebM quando necessário.
export function pickSupportedMimeType(): string {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "video/webm";
}
