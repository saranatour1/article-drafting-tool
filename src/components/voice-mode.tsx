import { ArrowLeft, Check, Keyboard, Lightbulb, Mic, Pause } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { canAutoStart, useDictation } from "@/components/mic-button";
import { Button } from "@/components/ui/button";
import type { Draft } from "@/lib/drafts";
import { VOICE } from "@/lib/look";
import { newDraft, useNav } from "@/lib/nav";
import { PLAIN, renderForPlatform } from "@/lib/platforms";
import { usePrefs } from "@/lib/prefs";
import { useDraft } from "@/lib/use-draft";
import { cn } from "@/lib/utils";

// Bigger than the editor's text: this page is read from arm's length while talking.
const SPOKEN_SIZE = { sm: "text-xl", md: "text-[1.375rem]", lg: "text-2xl" };

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** Full-screen dictation: listens as soon as it opens, and every phrase lands in the draft. */
export function VoiceMode({ draft, onCreated }: { draft: Draft | undefined; onCreated: (clientId: string) => void }) {
  const { prefs } = usePrefs();
  const { go } = useNav();
  const { view, latest, id, change, flush } = useDraft(draft, { source: "voice", destinations: null }, onCreated);
  const [heard, setHeard] = useState("");
  const [seconds, setSeconds] = useState(0);
  const mic = useDictation({
    onText: (text) => {
      const md = latest.current.markdown.trimEnd();
      change({ markdown: md ? `${md} ${text}` : text });
    },
    onInterim: setHeard,
  });
  const listening = mic.state === "listening";

  // biome-ignore lint/correctness/useExhaustiveDependencies: start once, when the mic is known to work
  useEffect(() => {
    if (mic.supported && canAutoStart()) mic.start();
  }, [mic.supported]);

  useEffect(() => {
    if (!listening) return;
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, [listening]);

  const html = useMemo(() => renderForPlatform(PLAIN, view.title, view.markdown).html, [view.title, view.markdown]);

  // Hand the draft over with its latest words, or go home if nothing was said.
  const leave = (to: "home" | "typing") => {
    flush();
    go(to === "home" ? {} : id.current ? { d: id.current } : newDraft());
  };

  return (
    <div className="flex min-h-screen flex-col bg-violet-50/70 p-2 dark:bg-ground">
      <main className="flex flex-1 flex-col rounded-[18px] border border-violet-200 bg-card shadow-xs dark:border-violet-500/20">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-3.5 py-2.5">
          <Button variant="ghost" onClick={() => leave("home")}>
            <ArrowLeft /> All drafts
          </Button>
          <span
            role="status"
            className={cn("inline-flex h-7.5 items-center gap-2 rounded-full px-3 text-[13px] font-semibold", VOICE.soft)}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                listening ? "animate-pulse bg-violet-600 ring-4 ring-violet-300/60" : "bg-violet-300",
              )}
            />
            {listening ? "Listening" : mic.state === "transcribing" ? "Finishing up" : "Paused"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!id.current}
              onClick={() => {
                change({ stage: "idea" });
                leave("home");
              }}
            >
              <Lightbulb className="text-yellow-700 dark:text-yellow-400" /> Keep as idea
            </Button>
            <Button variant="outline" onClick={() => leave("typing")}>
              <Keyboard /> Switch to typing
            </Button>
          </div>
        </header>

        <div
          className={cn(
            "mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 pt-14 pb-8 sm:px-8",
            prefs.writingFont === "serif" && "font-serif",
          )}
        >
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-violet-700 dark:text-violet-300">
            <Mic className="size-3.5" /> {draft ? "Adding to this draft by voice" : "New draft, started by voice"}
          </span>
          <input
            value={view.title}
            onChange={(e) => change({ title: e.target.value })}
            placeholder="Say a title later, or type one"
            aria-label="Title"
            className="w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60"
          />
          {/* Rendered like the plain page, so earlier typed headings and lists still read right. */}
          <div className={cn("prose prose-neutral max-w-none leading-relaxed dark:prose-invert", SPOKEN_SIZE[prefs.textSize])}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
            {heard && (
              <p>
                <span className="rounded-md bg-violet-100 px-1 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200">
                  {heard}
                </span>
              </p>
            )}
            {!view.markdown && !heard && (
              <p className="text-muted-foreground">
                {!mic.supported
                  ? "This browser can't record audio. Switch to typing instead."
                  : listening
                    ? "Start talking. Pauses are fine."
                    : "Tap the mic below to start talking."}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 px-4 pt-2 pb-7">
          <div className="flex flex-wrap items-center justify-center gap-3.5 rounded-full border border-violet-200 bg-card py-2 pr-2 pl-2.5 shadow-lg shadow-violet-900/10 dark:border-violet-500/25">
            <Button
              variant="outline"
              size="icon-lg"
              className="rounded-full"
              aria-label={listening ? "Pause dictation" : "Resume dictation"}
              disabled={!mic.supported || mic.state === "transcribing"}
              onClick={mic.toggle}
            >
              {listening ? <Pause /> : <Mic />}
            </Button>
            <span
              aria-hidden="true"
              className={cn(
                "grid size-11 place-items-center rounded-full ring-6",
                listening ? "bg-violet-600 text-white ring-violet-200 dark:ring-violet-500/25" : "bg-muted text-muted-foreground ring-transparent",
              )}
            >
              <Mic className="size-5" />
            </span>
            <span aria-hidden="true" className="flex h-8 items-center gap-[3px]">
              {[8, 16, 26, 14, 30, 20, 10, 24, 32, 18, 12, 22, 8, 14].map((h, i) => (
                <span
                  key={i}
                  className={cn("w-[3px] rounded-full", listening ? "animate-pulse bg-violet-500" : "bg-violet-200 dark:bg-violet-500/30")}
                  style={{ height: listening ? h : 6, animationDelay: `${(i % 5) * 120}ms` }}
                />
              ))}
            </span>
            <span className="min-w-11 text-center text-sm font-medium text-foreground/80 tabular-nums">{clock(seconds)}</span>
            <Button className="h-10.5 rounded-full px-4.5" onClick={() => leave(id.current ? "typing" : "home")}>
              <Check /> Done
            </Button>
          </div>
          <p className="max-w-md text-center text-[13px] text-muted-foreground">
            Pause whenever you like. Everything you said stays in this draft, and you can pick up typing right where it ends.
          </p>
        </div>
      </main>
    </div>
  );
}
