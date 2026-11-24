import { track } from "@databuddy/sdk";
import { LoaderCircle, Mic } from "lucide-react";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import { usePrefs } from "@/lib/prefs";
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

/** The microphone picked in Preferences, kept per browser because device ids are. "" is the system default. */
export const MIC_KEY = "mic";
export function chosenMic() {
  try {
    return localStorage.getItem(MIC_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Starting the mic right after a click; on a plain page load the browser may refuse, so wait for a tap. */
export const canAutoStart = () => navigator.userActivation?.isActive ?? true;

// Once the browser's recognition fails to reach its service (Brave, Arc), record
// and upload for the rest of the visit. Browsers without it (Firefox) start here.
let recordMode = false;

// Calibration for the recorded fallback; tune if quiet mics never cut or noisy rooms never pause.
const SPEECH_LEVEL = 0.015; // RMS above this counts as speech
const PAUSE_MS = 500; // this much quiet after speech ends a piece
const MIN_PIECE_MS = 1500; // shorter pieces give Whisper too little context
const MAX_PIECE_MS = 12_000; // cut anyway, so text keeps coming during long runs

const ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow it in your browser's site settings to dictate.",
  NotAllowedError: "Microphone access is blocked. Allow it in your browser's site settings to dictate.",
  "audio-capture": "No microphone found.",
  NotFoundError: "No microphone found.",
  "language-not-supported": "Speech recognition doesn't support your browser's language.",
};
const message = (code: string) => ERRORS[code] ?? `Dictation stopped: ${code}`;

/**
 * Dictation: each finished phrase goes to onText, and with onInterim the words
 * still being heard. Uses the browser's speech recognition (live), else records
 * a clip and transcribes it at /transcribe. Language and mode come from Preferences.
 */
export function useDictation({ onText, onInterim }: { onText: (text: string) => void; onInterim?: (text: string) => void }) {
  const { prefs } = usePrefs();
  // False on the server and the first client render, so hydration matches.
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<"idle" | "listening" | "transcribing">("idle");
  const stop = useRef<(() => void) | null>(null);
  const mounted = useRef(true);
  const send = useRef(onText);
  send.current = onText;
  const interim = useRef(onInterim);
  interim.current = onInterim;

  useEffect(() => {
    mounted.current = true;
    setSupported(Boolean(Recognizer()) || canRecord());
    return () => {
      mounted.current = false; // switching drafts turns the mic off and drops a recording
      const s = stop.current;
      stop.current = null; // so a remount (React's dev double-mount) can start afresh
      s?.();
    };
  }, []);

  /**
   * Near-real-time fallback: record in short pieces, cut at a pause, and
   * transcribe each piece while the next one records. Text lands a second or two
   * after each phrase, and no single upload gets long enough to time out.
   */
  const record = async () => {
    let stream: MediaStream;
    try {
      const mic = chosenMic();
      stream = await navigator.mediaDevices
        .getUserMedia({ audio: mic ? { deviceId: { exact: mic } } : true })
        // A picked mic that's been unplugged: use the default rather than fail.
        .catch((e) => (mic && e?.name === "OverconstrainedError" ? navigator.mediaDevices.getUserMedia({ audio: true }) : Promise.reject(e)));
    } catch (e) {
      return window.alert(message(e instanceof Error ? e.name : String(e)));
    }
    const audio = new AudioContext();
    const analyser = audio.createAnalyser();
    audio.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);

    let on = true;
    let failed = false;
    let recorder: MediaRecorder;
    let tick: ReturnType<typeof setInterval>;
    let pending = Promise.resolve(); // pieces are transcribed in order, so the text stays in order

    const transcribe = async (clip: Blob) => {
      if (failed || !mounted.current) return;
      try {
        const res = await fetch("/transcribe", { method: "POST", headers: { "Content-Type": clip.type }, body: clip });
        if (!res.ok) throw new Error(await res.text());
        const { text } = (await res.json()) as { text: string };
        if (mounted.current && text.trim()) send.current(text.trim());
      } catch (e) {
        failed = true; // one message, not one per piece
        stop.current?.();
        window.alert(`Couldn't transcribe: ${e instanceof Error ? e.message : e}`);
      }
    };

    const piece = () => {
      const chunks: Blob[] = [];
      const started = Date.now();
      let quietSince = 0;
      let spoke = false;
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        if (on) piece(); // start the next piece before uploading this one
        // Silent pieces are skipped: they cost money and Whisper invents text for silence.
        if (spoke) pending = pending.then(() => transcribe(new Blob(chunks, { type: chunks[0]?.type })));
        if (on) return;
        stream.getTracks().forEach((t) => t.stop());
        void audio.close();
        if (!mounted.current) return;
        setState("transcribing");
        void pending.then(() => mounted.current && setState("idle"));
      };
      recorder.start();
      tick = setInterval(() => {
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((s, x) => s + x * x, 0) / samples.length);
        const now = Date.now();
        if (rms > SPEECH_LEVEL) {
          spoke = true;
          quietSince = 0;
        } else quietSince ||= now;
        const pause = spoke && quietSince > 0 && now - quietSince > PAUSE_MS;
        if ((pause && now - started > MIN_PIECE_MS) || now - started > MAX_PIECE_MS) {
          clearInterval(tick);
          recorder.stop();
        }
      }, 100);
    };

    stop.current = () => {
      stop.current = null;
      on = false;
      clearInterval(tick);
      if (recorder.state !== "inactive") recorder.stop();
    };
    piece();
    setState("listening");
  };

  const listen = () => {
    const r = new (Recognizer()!)();
    r.continuous = true;
    r.interimResults = Boolean(interim.current);
    r.lang = prefs.language || navigator.language;
    r.onresult = (e) => {
      let heard = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript.trim();
        if (!e.results[i].isFinal) heard += ` ${text}`;
        else if (text) send.current(text);
      }
      interim.current?.(heard.trim());
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
    const mine = () => r.stop();
    r.onend = () => {
      // A session ending late must not mark a newer one as stopped.
      if (stop.current === mine) stop.current = null;
      if (stop.current !== null || !mounted.current) return;
      interim.current?.("");
      setState("idle");
    };
    stop.current = mine;
    r.start();
    setState("listening");
  };

  const toggle = () => {
    if (stop.current) return stop.current();
    track("dictation_started");
    // Live recognition always hears the system default mic, so a picked one means recording.
    if (recordMode || prefs.listen === "record" || chosenMic() || !Recognizer()) void record();
    else listen();
  };

  /** Starts unless already listening; for views that listen as soon as they open. */
  const start = () => {
    if (!stop.current) toggle();
  };

  return { supported, state, toggle, start };
}

export function MicButton({
  onText,
  autoStart,
  className,
  ...props
}: { onText: (text: string) => void; autoStart?: boolean } & ComponentProps<typeof Toggle>) {
  const { supported, state, toggle, start } = useDictation({ onText });
  // biome-ignore lint/correctness/useExhaustiveDependencies: start once, when the mic is known to work
  useEffect(() => {
    if (autoStart && supported && canAutoStart()) start();
  }, [supported]);
  if (!supported) return null;
  const busy = state === "transcribing";
  return (
    <Toggle
      aria-label={busy ? "Transcribing" : state === "listening" ? "Stop dictating" : "Dictate"}
      {...props}
      disabled={busy || props.disabled}
      pressed={state === "listening"}
      onPressedChange={toggle}
      className={cn(state === "listening" && "animate-pulse text-red-600 data-pressed:text-red-600", className)}
    >
      {busy ? <LoaderCircle className="animate-spin" /> : <Mic />}
    </Toggle>
  );
}
