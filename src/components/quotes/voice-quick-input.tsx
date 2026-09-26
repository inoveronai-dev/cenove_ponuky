"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { transcribeAudioAction } from "@/app/actions/transcribe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VoiceQuickInputProps = {
  disabled?: boolean;
  onTranscript: (text: string) => void | Promise<void>;
};

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export function VoiceQuickInput({
  disabled,
  onTranscript,
}: VoiceQuickInputProps) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined"
    );
    return () => {
      stopTracks();
    };
  }, []);

  function stopTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    if (busy || recording || disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stopTracks();
        await handleTranscript(blob, type);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      toast.message("Nahrávam… hovorte o zákazke, potom zastavte.");
    } catch {
      stopTracks();
      toast.error(
        "Nepodarilo sa spustiť mikrofón. Povoľte prístup v prehliadači."
      );
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setRecording(false);
      stopTracks();
      return;
    }
    recorder.stop();
    setRecording(false);
  }

  async function handleTranscript(blob: Blob, mimeType: string) {
    if (blob.size < 800) {
      toast.error("Nahrávka je príliš krátka.");
      return;
    }

    setBusy(true);
    try {
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const formData = new FormData();
      formData.append("audio", blob, `recording.${ext}`);
      const result = await transcribeAudioAction(formData);
      if (result.error || !result.text) {
        toast.error(result.error || "Prepísanie zlyhalo.");
        return;
      }
      await onTranscript(result.text);
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-xs text-muted-foreground">
        Mikrofón v tomto prehliadači nie je podporovaný. Použite textové zadanie.
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant={recording ? "destructive" : "secondary"}
      disabled={disabled || busy}
      className={cn(recording && "animate-pulse")}
      onClick={() => (recording ? stopRecording() : startRecording())}
    >
      {recording ? (
        <>
          <Square className="h-4 w-4" />
          Zastaviť nahrávanie
        </>
      ) : busy ? (
        "Prepisujem…"
      ) : (
        <>
          <Mic className="h-4 w-4" />
          Nahrať hlasom
        </>
      )}
    </Button>
  );
}
