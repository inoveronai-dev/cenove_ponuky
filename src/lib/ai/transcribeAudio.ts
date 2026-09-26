import OpenAI from "openai";
import { toFile } from "openai";

export type TranscribeResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function transcribeAudioBlob(
  bytes: ArrayBuffer,
  filename: string,
  mimeType: string
): Promise<TranscribeResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      ok: false,
      error:
        "Chýba OPENAI_API_KEY. Nastavte ho v .env.local alebo vo Vercel Environment Variables.",
    };
  }

  if (!bytes.byteLength) {
    return { ok: false, error: "Nahrávka je prázdna." };
  }

  // ~25 MB Whisper limit — keep a safe client-side ceiling below that
  if (bytes.byteLength > 20 * 1024 * 1024) {
    return { ok: false, error: "Nahrávka je príliš veľká (max. ~20 MB)." };
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const file = await toFile(Buffer.from(bytes), filename || "recording.webm", {
      type: mimeType || "audio/webm",
    });

    const result = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "sk",
      response_format: "text",
    });

    const text = (typeof result === "string" ? result : String(result)).trim();
    if (!text) {
      return { ok: false, error: "Nepodarilo sa rozpoznať reč. Skúste znova." };
    }

    return { ok: true, text };
  } catch (err) {
    console.error("Whisper transcription failed:", err);
    return {
      ok: false,
      error: "Prepísanie nahrávky zlyhalo. Skontrolujte API kľúč a skúste znova.",
    };
  }
}
