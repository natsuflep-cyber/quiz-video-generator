import { NextRequest, NextResponse } from "next/server";
import { EdgeTTS } from "msedge-tts";

// Precisa rodar em runtime Node.js (usa WebSocket internamente), não no Edge Runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vozes neurais em português do Brasil disponíveis no serviço gratuito do Edge TTS.
const VOICE = "pt-BR-FranciscaNeural";
const FORMAT = "audio-24khz-48kbitrate-mono-mp3";

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as { text?: string };

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Campo 'text' é obrigatório." },
        { status: 400 }
      );
    }

    const tts = new EdgeTTS();
    // @ts-expect-error - a assinatura aceita o nome do formato como string
    await tts.setMetadata(VOICE, FORMAT);

    const stream = tts.toStream(text);
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve());
      stream.on("error", (err: Error) => reject(err));
    });

    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Erro ao gerar narração TTS:", err);
    return NextResponse.json(
      {
        error:
          "Não foi possível gerar a narração agora. O vídeo será gerado sem áudio de narração.",
      },
      { status: 502 }
    );
  }
}
