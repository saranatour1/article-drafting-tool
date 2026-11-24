import { FileText, House, Lightbulb, Lock, Mic, PenLine, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Draft } from "@/lib/drafts";
import { HAND, type Label, VOICE } from "@/lib/look";
import { newDraft, speak, useNav } from "@/lib/nav";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { AccountMenu } from "./account-menu";
import { LabelDot } from "./bits";

const navItem =
  "flex h-8.5 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm text-foreground/80 hover:bg-background/70 aria-[current=page]:bg-background aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:shadow-xs aria-[current=page]:ring-1 aria-[current=page]:ring-border [&>svg]:size-4 [&>svg]:shrink-0";

export function AppSidebar({ drafts, labels }: { drafts: Draft[]; labels: Label[] }) {
  const { view, go } = useNav();
  const { prefs } = usePrefs();
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shown = drafts.filter(
    (d) =>
      (!query || d.title.toLowerCase().includes(query.toLowerCase())) &&
      (!view.label || d.labels.includes(view.label)),
  );
  const ideas = shown.filter((d) => d.stage === "idea");
  const written = shown.filter((d) => d.stage !== "idea");
  const labelOf = (d: Draft) => labels.find((l) => d.labels.includes(l.clientId));
  const atHome = !view.d && !view.s;

  const item = (d: Draft) => {
    const label = labelOf(d);
    return (
      <li key={d.clientId}>
        <button
          type="button"
          onClick={() => go({ d: d.clientId })}
          aria-current={view.d === d.clientId ? "page" : undefined}
          className={cn(navItem, "h-8 text-[13px]")}
        >
          {label ? <LabelDot label={label} /> : <span aria-hidden="true" className="size-2 shrink-0 rounded-[3px] bg-border" />}
          <span className="truncate">{d.title || "Untitled"}</span>
        </button>
      </li>
    );
  };

  return (
    <aside className="flex w-full flex-col gap-5 p-3 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto">
      <button type="button" onClick={() => go({})} className="flex items-center gap-2.5 px-1.5 text-[15px] font-semibold tracking-tight">
        <img src="/logo.svg" alt="" className="size-7" />
        Article drafts
      </button>

      <label className="flex h-9 items-center gap-2 rounded-[10px] border bg-background px-2.5 text-muted-foreground shadow-xs focus-within:ring-3 focus-within:ring-ring/50">
        <Search className="size-4 shrink-0" />
        <input
          ref={search}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your writing"
          aria-label="Search your writing"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <Kbd>⌘K</Kbd>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => go(speak(prefs.voiceFullscreen))}
          className={cn("flex h-10 items-center gap-2 rounded-[10px] border px-3 text-[13px] font-semibold", VOICE.soft)}
        >
          <Mic className="size-4" /> Speak
        </button>
        <button
          type="button"
          onClick={() => go(newDraft())}
          className={cn("flex h-10 items-center gap-2 rounded-[10px] border px-3 text-[13px] font-semibold", HAND.soft)}
        >
          <PenLine className="size-4" /> Write
        </button>
      </div>

      <nav aria-label="Your writing" className="flex flex-col gap-4 max-lg:max-h-80 max-lg:overflow-y-auto">
        <button type="button" onClick={() => go({})} aria-current={atHome && !view.label ? "page" : undefined} className={navItem}>
          <House /> Home
        </button>
        <section aria-labelledby="ideas-heading">
          <h2 id="ideas-heading" className="flex items-center gap-2.5 px-2.5 pb-1 text-xs font-medium text-muted-foreground">
            <Lightbulb className="size-3.5 text-yellow-700 dark:text-yellow-400" /> Ideas
            <span className="ml-auto">{ideas.length}</span>
          </h2>
          <ul className="flex flex-col gap-0.5">{ideas.map(item)}</ul>
        </section>
        <section aria-labelledby="drafts-heading">
          <h2 id="drafts-heading" className="flex items-center gap-2.5 px-2.5 pb-1 text-xs font-medium text-muted-foreground">
            <FileText className="size-3.5 text-blue-700 dark:text-blue-400" /> Drafts
            <span className="ml-auto">{written.length}</span>
          </h2>
          <ul className="flex flex-col gap-0.5">
            {written.map(item)}
            {written.length === 0 && <li className="px-2.5 text-[13px] text-muted-foreground">Nothing here yet.</li>}
          </ul>
        </section>
      </nav>

      <section aria-labelledby="labels-heading" className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between pr-1 pb-1 pl-2.5">
          <h2 id="labels-heading" className="text-xs font-medium text-muted-foreground">
            Labels
          </h2>
          <button
            type="button"
            aria-label="Manage labels"
            onClick={() => go({ s: "labels" })}
            className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        {labels.map((l) => (
          <button
            key={l.clientId}
            type="button"
            aria-pressed={view.label === l.clientId}
            onClick={() => go(view.label === l.clientId ? {} : { label: l.clientId })}
            className={cn(navItem, "h-8 aria-pressed:bg-background aria-pressed:font-medium aria-pressed:shadow-xs")}
          >
            <LabelDot label={l} className="size-2.5" />
            <span className="truncate">{l.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">{drafts.filter((d) => d.labels.includes(l.clientId)).length}</span>
          </button>
        ))}
        <p className="flex gap-1.5 px-2.5 pt-1.5 text-xs leading-snug text-muted-foreground">
          <Lock className="mt-0.5 size-3 shrink-0" />
          {labels.length ? "Labels sort your writing here. They never get published." : "Add labels to sort your writing. They never get published."}
        </p>
      </section>

      <div className="mt-auto">
        <AccountMenu drafts={drafts} labels={labels} />
      </div>
    </aside>
  );
}
