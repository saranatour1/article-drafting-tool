import { track } from "@databuddy/sdk";
import { LoaderCircle, Mic } from "lucide-react";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

// TypeScript's DOM lib has no Web Speech API types; this is the part we use.
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

const Recognizer = () =>
  (window as unknown as Record<string, (new () => Recognition) | undefined>).SpeechRecognition ??
  (window as unknown as Record<string, (new () => Recognition) | undefined>).webkitSpeechRecognition;

const canRecord = () => typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

// Once the browser's recognition fails to reach its service (Brave, Arc), record
// and upload for the rest of the visit. Browsers without it (Firefox) start here.
let recordMode = false;

const ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow it in your browser's site settings to dictate.",
  NotAllowedError: "Microphone access is blocked. Allow it in your browser's site settings to dictate.",
  "audio-capture": "No microphone found.",
  NotFoundError: "No microphone found.",
  "language-not-supported": "Speech recognition doesn't support your browser's language.",
};
const message = (code: string) => ERRORS[code] ?? `Dictation stopped: ${code}`;

/**
 * Dictation: each finished phrase goes to onText. Uses the browser's speech
 * recognition (live), else records a clip and transcribes it at /transcribe.
 */
export function MicButton({ onText, className, ...props }: { onText: (text: string) => void } & ComponentProps<typeof Toggle>) {
  // False on the server and the first client render, so hydration matches.
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<"idle" | "listening" | "transcribing">("idle");
  const stop = useRef<(() => void) | null>(null);
  const mounted = useRef(true);
  const send = useRef(onText);
  send.current = onText;

  useEffect(() => {
    mounted.current = true;
    setSupported(Boolean(Recognizer()) || canRecord());
    return () => {
      mounted.current = false; // switching drafts turns the mic off and drops a recording
      stop.current?.();
    };
  }, []);

  if (!supported) return null;

  const record = async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      return window.alert(message(e instanceof Error ? e.name : String(e)));
    }
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      stop.current = null;
      if (!mounted.current) return;
      setState("transcribing");
      try {
        const res = await fetch("/transcribe", {
          method: "POST",
          headers: { "Content-Type": recorder.mimeType },
          body: new Blob(chunks, { type: recorder.mimeType }),
        });
        if (!res.ok) throw new Error(await res.text());
        const { text } = (await res.json()) as { text: string };
        if (mounted.current && text.trim()) send.current(text.trim());
      } catch (e) {
        window.alert(`Couldn't transcribe: ${e instanceof Error ? e.message : e}`);
      }
      if (mounted.current) setState("idle");
    };
    stop.current = () => recorder.stop();
    recorder.start();
    setState("listening");
  };

  const listen = () => {
    const r = new (Recognizer()!)();
    r.continuous = true;
    r.interimResults = false;
    r.lang = navigator.language;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript.trim();
        if (e.results[i].isFinal && text) send.current(text);
      }
    };
    r.onerror = (e) => {
      if (e.error === "aborted" || e.error === "no-speech") return; // stopped by us, or silence
      // No speech service behind the API (Brave, Arc) or it's off (Safari without Siri): record instead.
      if ((e.error === "network" || e.error === "service-not-allowed") && canRecord()) {
        recordMode = true;
        r.onend = null;
        stop.current = null;
        void record();
        return;
      }
      window.alert(message(e.error));
    };
    r.onend = () => {
      stop.current = null;
      setState("idle");
    };
    stop.current = () => r.stop();
    r.start();
    setState("listening");
  };

  const toggle = () => {
    if (stop.current) return stop.current();
    track("dictation_started");
    if (recordMode || !Recognizer()) void record();
    else listen();
  };

  const busy = state === "transcribing";
  return (
    <Toggle
      aria-label={busy ? "Transcribing" : state === "listening" ? "Stop dictating" : "Dictate"}
      {...props}
      disabled={busy || props.disabled}
      pressed={state === "listening"}
      onPressedChange={toggle}
      className={cn(state === "listening" && "text-red-600 data-[state=on]:text-red-600 animate-pulse", className)}
    >
      {busy ? <LoaderCircle className="animate-spin" /> : <Mic />}
    </Toggle>
  );
}
