import { ArrowRight, Lightbulb, Mic, PenLine, Plus } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { MicButton } from "@/components/mic-button";
import { Button } from "@/components/ui/button";
import { type Draft, getDraftStore } from "@/lib/drafts";
import { HAND, IDEA_TINTS, type Label, VOICE } from "@/lib/look";
import { newDraft, newVoice, useNav } from "@/lib/nav";
import { PLATFORMS, type Site, destinationsFor, sitePlatform } from "@/lib/platforms";
import { usePrefs } from "@/lib/prefs";
import { ago, excerpt, wordCount } from "@/lib/text";
import { cn } from "@/lib/utils";
import { LabelChip, LabelDot, PlatformMark } from "./bits";

export function Home({ drafts, labels, sites }: { drafts: Draft[]; labels: Label[]; sites: Site[] }) {
  const { prefs } = usePrefs();
  const { view, go } = useNav();
  const labelled = (d: Draft) => !view.label || d.labels.includes(view.label);
  const ideas = drafts.filter((d) => d.stage === "idea" && labelled(d));
  const recent = drafts.filter((d) => d.stage !== "idea" && labelled(d)).slice(0, 6);
  const usedLabels = labels.filter((l) => drafts.some((d) => d.stage !== "idea" && d.labels.includes(l.clientId)));

  const speak = (
    <ModeCard
      key="speak"
      onClick={() => go(newVoice())}
      tint={VOICE.soft}
      button={VOICE.solid}
      icon={<Mic />}
      title="Talk it through"
      text="Hit record and think out loud. Your words show up as you speak, ready to shape into a draft."
      action="Start speaking"
    />
  );
  const write = (
    <ModeCard
      key="write"
      onClick={() => go(newDraft())}
      tint={HAND.soft}
      button={HAND.solid}
      icon={<PenLine />}
      title="Write it out"
      text="A quiet page with nothing in the way. Type / for headings, lists and images when you need them."
      action="Start writing"
    />
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 pt-12 pb-20 sm:px-8">
      <div className="flex flex-col gap-2.5">
        <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">What do you want to say today?</h1>
        <p className="max-w-xl text-base text-muted-foreground">
          Say it out loud or write it down. Both land on the same page, and you can switch halfway through a sentence.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">{prefs.startWith === "write" ? [write, speak] : [speak, write]}</div>

      {(prefs.ideaBox || ideas.length > 0) && (
        <section aria-labelledby="ideas-title" className="flex flex-col gap-3.5">
          <h2 id="ideas-title" className="text-lg font-semibold tracking-tight">
            Ideas <span className="font-normal text-muted-foreground">{ideas.length}</span>
          </h2>
          {prefs.ideaBox && <IdeaBox label={view.label} />}
          {ideas.length > 0 && (
            <ul className="flex flex-wrap gap-3.5 pt-1">
              {ideas.slice(0, 8).map((d, i) => (
                <li key={d.clientId} className="flex flex-[1_1_200px]">
                  <button
                    type="button"
                    onClick={() => go({ d: d.clientId })}
                    className={cn(
                      "flex min-h-32 w-full flex-col justify-between gap-4 rounded-xl border p-4 text-left shadow-xs transition-transform hover:-translate-y-0.5",
                      IDEA_TINTS[i % IDEA_TINTS.length],
                      i % 2 ? "rotate-[0.6deg]" : "rotate-[-0.6deg]",
                    )}
                  >
                    <span className="text-[17px] leading-snug font-medium">{d.title || "Untitled idea"}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium opacity-80" suppressHydrationWarning>
                      {d.source === "voice" ? <Mic className="size-3.5" /> : <PenLine className="size-3.5" />}
                      {d.source === "voice" ? "Spoken" : "Typed"} · {ago(d.updatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="recent-title" className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="recent-title" className="text-lg font-semibold tracking-tight">
            Pick up where you left off
          </h2>
          {usedLabels.length > 0 && (
            <div role="group" aria-label="Filter by label" className="flex flex-wrap gap-1.5">
              <FilterChip pressed={!view.label} onClick={() => go({})}>
                All
              </FilterChip>
              {usedLabels.map((l) => (
                <FilterChip key={l.clientId} pressed={view.label === l.clientId} onClick={() => go({ label: l.clientId })}>
                  <LabelDot label={l} /> {l.name}
                </FilterChip>
              ))}
            </div>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            {view.label ? "No drafts with this label yet." : "No drafts yet. Start one above, or turn an idea into one."}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-3.5">
            {recent.map((d) => (
              <li key={d.clientId} className="flex flex-[1_1_290px]">
                <button
                  type="button"
                  onClick={() => go({ d: d.clientId })}
                  className="flex w-full flex-col gap-3 rounded-2xl border bg-card p-4.5 text-left shadow-xs transition-colors hover:border-foreground/20"
                >
                  {d.labels.length > 0 && (
                    <span className="flex flex-wrap gap-1.5">
                      {labels
                        .filter((l) => d.labels.includes(l.clientId))
                        .map((l) => (
                          <LabelChip key={l.clientId} label={l} />
                        ))}
                    </span>
                  )}
                  <span className="text-xl leading-tight font-semibold tracking-tight">{d.title || "Untitled"}</span>
                  <span className="line-clamp-2 text-sm text-muted-foreground">{excerpt(d.markdown) || "Empty so far."}</span>
                  <span className="mt-auto flex items-center justify-between gap-2 border-t pt-2.5 text-xs text-muted-foreground">
                    <span suppressHydrationWarning>
                      {ago(d.updatedAt)} · {wordCount(d.markdown).toLocaleString()} words
                    </span>
                    <span className="flex gap-1">
                      {destinationsFor(d.destinations ?? prefs.destinations, sites)
                        .slice(0, 4)
                        .map((p) => (
                          <PlatformMark key={p.id} platform={p} />
                        ))}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="dest-title" className="flex flex-col gap-4 rounded-2xl border bg-muted/40 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex max-w-xl flex-col gap-1.5">
            <h2 id="dest-title" className="text-lg font-semibold tracking-tight">
              Send it anywhere
            </h2>
            <p className="text-sm text-muted-foreground">
              Every draft starts as plain writing. Add places when you're ready, and each one gets headings, tags and
              front matter shaped for it. Or skip them and just copy the words.
            </p>
          </div>
          <Button variant="outline" onClick={() => go({ s: "preferences" })}>
            Default destinations
          </Button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {[...PLATFORMS, ...sites.map(sitePlatform)].map((p) => (
            <li key={p.id} className="flex h-9 items-center gap-2 rounded-[10px] border bg-background pr-3 pl-2 text-[13px] font-medium">
              <PlatformMark platform={p} />
              {p.label}
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => go({ s: "labels" })}
              className="flex h-9 items-center gap-2 rounded-[10px] border border-dashed pr-3 pl-2 text-[13px] font-medium text-foreground/80 hover:bg-background"
            >
              <span className="grid size-5.5 place-items-center rounded-md bg-muted">
                <Plus className="size-3.5" />
              </span>
              Your own site
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
}

function ModeCard(props: {
  onClick: () => void;
  tint: string;
  button: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  action: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn("group flex flex-[1_1_320px] flex-col gap-5 rounded-3xl border p-6 text-left", props.tint)}
    >
      <span className={cn("grid size-14 place-items-center rounded-full [&_svg]:size-6", props.button)}>{props.icon}</span>
      <span className="flex flex-col gap-1.5">
        <span className="text-[22px] font-semibold tracking-tight">{props.title}</span>
        <span className="text-[15px] leading-relaxed opacity-90">{props.text}</span>
      </span>
      <span className={cn("inline-flex h-9.5 items-center gap-2 self-start rounded-[10px] px-4 text-sm font-medium shadow-xs", props.button)}>
        {props.action}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function FilterChip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium text-foreground/80 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
    >
      {children}
    </button>
  );
}

/** One line, typed or spoken; ideas stay in the list until you start drafting one. */
function IdeaBox({ label }: { label?: string }) {
  const [idea, setIdea] = useState("");
  const spoke = useRef(false);

  function add(e: FormEvent) {
    e.preventDefault();
    const title = idea.trim();
    if (!title) return;
    getDraftStore().saveDraft({
      clientId: crypto.randomUUID(),
      title,
      markdown: "",
      tags: [],
      stage: "idea",
      labels: label ? [label] : [],
      destinations: null,
      source: spoke.current ? "voice" : "typed",
      updatedAt: Date.now(),
    });
    setIdea("");
    spoke.current = false;
  }

  return (
    <form onSubmit={add} className="flex items-center gap-1.5 rounded-2xl border bg-card p-1.5 shadow-xs">
      <label className="flex min-w-0 flex-1 items-center gap-2.5 pr-2 pl-2.5">
        <Lightbulb className="size-4.5 shrink-0 text-yellow-700 dark:text-yellow-400" />
        <input
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Catch an idea before it slips away"
          aria-label="New idea"
          maxLength={500}
          className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
      </label>
      <MicButton
        aria-label="Dictate an idea"
        className={cn("size-10 rounded-[10px] border", VOICE.soft)}
        onText={(text) => {
          spoke.current = true;
          setIdea((s) => (s ? `${s} ${text}` : text).slice(0, 500));
        }}
      />
      <Button type="submit" className="h-10 rounded-[10px] px-4">
        Add idea
      </Button>
    </form>
  );
}
