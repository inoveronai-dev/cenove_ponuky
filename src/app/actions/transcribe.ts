"use server";

import { transcribeAudioBlob } from "@/lib/ai/transcribeAudio";

export async function transcribeAudioAction(formData: FormData) {
  const audio = formData.get("audio");
  if (!audio || typeof audio === "string") {
    return { error: "Chýba audio súbor." };
  }

  const file = audio as File;
  const bytes = await file.arrayBuffer();
  const filename =
    file.name ||
    `recording.${(file.type || "audio/webm").includes("mp4") ? "mp4" : "webm"}`;

  const result = await transcribeAudioBlob(
    bytes,
    filename,
    file.type || "audio/webm"
  );

  if (!result.ok) return { error: result.error };
  return { text: result.text };
}
