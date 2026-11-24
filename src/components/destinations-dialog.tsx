import { Check, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLAIN, PLATFORMS, type Platform, type Site, sitePlatform } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import { PlatformMark } from "./bits";

/** Pick the places a draft is headed; each becomes a preview tab. The plain page is always on. */
export function DestinationsDialog({
  open,
  onOpenChange,
  value,
  onSave,
  sites,
  onAddSite,
  title = "Where is this going?",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string[];
  onSave: (ids: string[]) => void;
  sites: Site[];
  onAddSite: () => void;
  title?: string;
}) {
  const [picked, setPicked] = useState(value);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (open) {
      setPicked(value);
      setQuery("");
    }
  }, [open, value]);
  const matches = (p: Platform) => `${p.label} ${p.summary}`.toLowerCase().includes(query.trim().toLowerCase());

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const groups: [string, Platform[]][] = [
    ["Blogs and newsletters", PLATFORMS.filter((p) => p.group === "blog" && matches(p))],
    ["Social", PLATFORMS.filter((p) => p.group === "social" && matches(p))],
    ["Your own", sites.map(sitePlatform).filter(matches)],
  ];
  const names = [...PLATFORMS, ...sites.map(sitePlatform)].filter((p) => picked.includes(p.id) && p.id !== PLAIN.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Pick as many as you like. Each one becomes a preview tab, with headings, tags and front matter shaped for that
            site.
          </DialogDescription>
        <label className="mt-2 flex h-9.5 items-center gap-2 rounded-[10px] border bg-background px-3 text-muted-foreground shadow-xs focus-within:ring-3 focus-within:ring-ring/50">
          <Search className="size-4 shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destinations"
            aria-label="Search destinations"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-5">
        <section aria-labelledby="g-words" className="flex flex-col gap-2.5">
          <h3 id="g-words" className="text-xs font-medium text-muted-foreground">
            Just the words
          </h3>
          <div className="flex flex-wrap items-center gap-3.5 rounded-xl border bg-muted/40 p-3.5">
            <PlatformMark platform={PLAIN} className="size-9 rounded-lg border bg-background text-[13px]" />
            <div className="flex min-w-52 flex-1 flex-col">
              <span className="text-sm font-semibold">{PLAIN.label}</span>
              <span className="text-xs text-muted-foreground">{PLAIN.summary}</span>
            </div>
            <span className="inline-flex h-6 items-center gap-1 rounded-md bg-green-100 px-2 text-xs font-semibold text-green-800 dark:bg-green-500/15 dark:text-green-200">
              <Check className="size-3" /> Always on
            </span>
          </div>
        </section>

        {query.trim() && groups.every(([, platforms]) => platforms.length === 0) && (
          <p className="text-sm text-muted-foreground">Nothing matches “{query.trim()}”. You can add it as your own site.</p>
        )}
        {groups.map(([name, platforms]) => (
          (platforms.length > 0 || name === "Your own") && (
          <section key={name} aria-label={name} className="flex flex-col gap-2.5">
            <h3 className="text-xs font-medium text-muted-foreground">{name}</h3>
            <div className="flex flex-wrap gap-2.5">
              {platforms.map((p) => {
                const on = picked.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(p.id)}
                    className={cn(
                      "flex flex-[1_1_210px] items-start gap-3 rounded-xl border bg-background p-3 text-left transition-colors hover:border-foreground/25",
                      on && "border-violet-600 bg-violet-50/60 ring-3 ring-violet-200 dark:bg-violet-500/10 dark:ring-violet-500/25",
                    )}
                  >
                    <PlatformMark platform={p} className="size-8 rounded-lg text-xs" />
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm font-semibold">{p.label}</span>
                      <span className="text-xs text-muted-foreground">{p.summary}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]",
                        on ? "border-violet-600 bg-violet-600 text-white" : "border-border",
                      )}
                    >
                      {on && <Check className="size-3" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
              {name === "Your own" && (
                <button
                  type="button"
                  onClick={onAddSite}
                  className="flex flex-[1_1_210px] items-start gap-3 rounded-xl border border-dashed p-3 text-left hover:bg-muted/40"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-muted">
                    <Plus className="size-4" />
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold">Add a site</span>
                    <span className="text-xs text-muted-foreground">Set its heading levels, tag rules and front matter once.</span>
                  </span>
                </button>
              )}
            </div>
          </section>
          )
        ))}
        </DialogPanel>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {names.length ? `${names.map((p) => p.label).join(", ")}, plus the plain page` : "Just the plain page"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSave(picked.filter((id) => id !== PLAIN.id));
                onOpenChange(false);
              }}
            >
              Save destinations
            </Button>
          </div>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
