import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

// Precisa rodar em runtime Node.js (usa WebSocket internamente), não no Edge Runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vozes neurais em português do Brasil disponíveis no serviço gratuito do Edge TTS.
const VOICE = "pt-BR-FranciscaNeural";
const FORMAT = OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3;

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as { text?: string };

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Campo 'text' é obrigatório." },
        { status: 400 }
      );
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(VOICE, FORMAT);

    const { audioStream } = tts.toStream(text);
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      audioStream.on("end", () => resolve());
      audioStream.on("close", () => resolve());
      audioStream.on("error", (err: Error) => reject(err));
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
