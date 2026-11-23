import { track } from "@databuddy/sdk";
import { Mic } from "lucide-react";
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

const ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow it in your browser's site settings to dictate.",
  "service-not-allowed":
    "This browser won't run speech recognition here. In Safari, turn on Siri or Dictation in System Settings.",
  // Chromium browsers without Google's speech service (Brave, Arc, Electron apps) fail this way.
  network: "This browser can't reach a speech recognition service. Try Chrome, Edge or Safari.",
  "audio-capture": "No microphone found.",
  "language-not-supported": "Speech recognition doesn't support your browser's language.",
};

/**
 * Dictation through the browser's own speech recognition: each finished phrase
 * goes to onText. Hidden where it isn't supported (Firefox).
 * ponytail: Web Speech API (Chrome sends audio to Google); record + server-side
 * speech-to-text if Firefox or privacy matters, see docs/plans/voice-dictation.md.
 */
export function MicButton({ onText, className, ...props }: { onText: (text: string) => void } & ComponentProps<typeof Toggle>) {
  // False on the server and the first client render, so hydration matches.
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const send = useRef(onText);
  send.current = onText;

  useEffect(() => {
    setSupported(Boolean(Recognizer()));
    return () => rec.current?.stop(); // switching drafts turns the mic off
  }, []);

  if (!supported) return null;

  const toggle = () => {
    if (rec.current) return rec.current.stop();
    const Ctor = Recognizer()!;
    const r = new Ctor();
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
      window.alert(ERRORS[e.error] ?? `Dictation stopped: ${e.error}`);
    };
    r.onend = () => {
      rec.current = null;
      setListening(false);
    };
    rec.current = r;
    r.start();
    setListening(true);
    track("dictation_started");
  };

  return (
    <Toggle
      aria-label={listening ? "Stop dictating" : "Dictate"}
      {...props}
      pressed={listening}
      onPressedChange={toggle}
      className={cn(listening && "text-red-600 data-[state=on]:text-red-600 animate-pulse", className)}
    >
      <Mic />
    </Toggle>
  );
}
