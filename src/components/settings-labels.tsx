import { useMutation } from "convex/react";
import { House, Plus, Tag, Trash2 } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { Draft } from "@/lib/drafts";
import { LABEL_COLORS, type Label, type LabelColor } from "@/lib/look";
import { type Site, renderForPlatform, sitePlatform } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import { Card, LabelDot, PlatformMark } from "./bits";
import { PageTitle } from "./settings";

const COLORS = Object.keys(LABEL_COLORS) as LabelColor[];

export function LabelSettings({ drafts, labels, sites }: { drafts: Draft[]; labels: Label[]; sites: Site[] }) {
  return (
    <>
      <PageTitle title="Labels and sites">
        Labels sort your writing here. Sites decide how a draft is shaped when it leaves.
      </PageTitle>
      <Labels drafts={drafts} labels={labels} />
      <Sites drafts={drafts} sites={sites} />
    </>
  );
}

function Labels({ drafts, labels }: { drafts: Draft[]; labels: Label[] }) {
  const save = useMutation(api.labels.save);
  const remove = useMutation(api.labels.remove);
  const [name, setName] = useState("");

  function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    void save({ clientId: crypto.randomUUID(), name: name.trim().slice(0, 40), color: COLORS[labels.length % COLORS.length] });
    setName("");
  }

  return (
    <Card
      icon={<Tag />}
      tint="bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200"
      title="Labels"
      description="Series, clients, moods. Only you see them, and they never go into what you copy."
    >
      <ul>
        {labels.map((l) => {
          const count = drafts.filter((d) => d.labels.includes(l.clientId)).length;
          return (
            <li key={l.clientId} className="flex items-center gap-3 border-t px-5 py-3">
              <Popover>
                <PopoverTrigger
                  aria-label={`Color for ${l.name}: ${l.color}`}
                  className={cn("grid size-8 shrink-0 place-items-center rounded-lg", LABEL_COLORS[l.color].chip)}
                >
                  <LabelDot label={l} className="size-3" />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-2.5">
                  <div role="radiogroup" aria-label={`Color for ${l.name}`} className="flex gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        role="radio"
                        aria-checked={l.color === color}
                        aria-label={color}
                        onClick={() => void save({ ...l, color })}
                        className={cn(
                          "size-6 rounded-md",
                          LABEL_COLORS[color].dot,
                          l.color === color && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                        )}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                defaultValue={l.name}
                aria-label="Label name"
                maxLength={40}
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (next && next !== l.name) void save({ ...l, name: next });
                  else e.target.value = l.name;
                }}
                className="h-8.5 flex-1"
              />
              <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                {count} draft{count === 1 ? "" : "s"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete label ${l.name}`}
                onClick={() => {
                  if (window.confirm(`Delete the label “${l.name}”? Drafts keep their words; they just lose this label.`)) {
                    void remove({ clientId: l.clientId });
                  }
                }}
              >
                <Trash2 />
              </Button>
            </li>
          );
        })}
      </ul>
      <form onSubmit={add} className="flex items-center gap-3 border-t px-5 py-3.5">
        <span aria-hidden="true" className="size-8 shrink-0 rounded-lg border border-dashed" />
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New label name" aria-label="New label name" maxLength={40} className="h-8.5 flex-1" />
        <Button type="submit">Add label</Button>
      </form>
    </Card>
  );
}

const NEW_SITE: Omit<Site, "clientId"> = {
  name: "",
  headingTop: 2,
  headingSub: 3,
  maxTags: 0,
  lowercaseTags: false,
  frontMatter: "---\ntitle: {title}\ntags: {tags}\ndate: {date}\n---",
  tip: "",
};

function Sites({ drafts, sites }: { drafts: Draft[]; sites: Site[] }) {
  const [editing, setEditing] = useState<Site | null>(null);
  return (
    <Card
      id="sites"
      icon={<House />}
      tint="bg-pink-100 text-pink-800 dark:bg-pink-500/15 dark:text-pink-200"
      title="Your own sites"
      description="Teach it a site once. It becomes a destination with its own preview tab, like dev.to or Medium."
    >
      <ul>
        {sites.map((site) =>
          editing?.clientId === site.clientId ? (
            <li key={site.clientId} className="border-t">
              <SiteForm initial={site} drafts={drafts} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={site.clientId} className="flex items-center gap-3 border-t px-5 py-3">
              <PlatformMark platform={sitePlatform(site)} className="size-8 rounded-lg text-[13px]" />
              <span className="flex flex-1 flex-col">
                <span className="text-sm font-semibold">{site.name}</span>
                <span className="text-xs text-muted-foreground">{sitePlatform(site).summary}</span>
              </span>
              <Button variant="outline" onClick={() => setEditing(site)}>
                Edit
              </Button>
            </li>
          ),
        )}
        {editing && !sites.some((s) => s.clientId === editing.clientId) && (
          <li className="border-t">
            <SiteForm initial={editing} drafts={drafts} onDone={() => setEditing(null)} />
          </li>
        )}
      </ul>
      {!editing && (
        <div className="px-5 pt-1 pb-5">
          <button
            type="button"
            onClick={() => setEditing({ clientId: crypto.randomUUID(), ...NEW_SITE })}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-medium text-foreground/80 hover:bg-muted/40"
          >
            <Plus className="size-4" /> Add a site
          </button>
        </div>
      )}
    </Card>
  );
}

const SAMPLE = {
  title: "A sample post",
  markdown: "An opening line.\n\n## A section\n\nSome words under it.\n\n### A smaller section\n\nAnd a few more.",
  tags: ["writing", "Web Dev"],
};

function SiteForm({ initial, drafts, onDone }: { initial: Site; drafts: Draft[]; onDone: () => void }) {
  const save = useMutation(api.sites.save);
  const remove = useMutation(api.sites.remove);
  const [site, setSite] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const edit = (patch: Partial<Site>) => setSite((s) => ({ ...s, ...patch }));
  const isNew = initial.name === "";

  // Shown with your latest draft that has words in it, so the rules read on something real.
  const sample = drafts.find((d) => d.stage !== "idea" && d.markdown.trim()) ?? SAMPLE;
  const example = useMemo(
    () => renderForPlatform(sitePlatform({ ...site, name: site.name || "Your site" }), sample.title, sample.markdown, sample.tags).markdown,
    [site, sample],
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!site.name.trim()) return setError("Give the site a name.");
    try {
      await save(site);
      onDone();
    } catch {
      setError("Couldn't save the site. Check the fields and try again.");
    }
  }

  const levels = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i).map((n) => (
      <NativeSelectOption key={n} value={n}>
        Heading {n} ({"#".repeat(n)})
      </NativeSelectOption>
    ));

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 px-5 py-4">
      <div className="flex flex-wrap gap-5">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5">
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Name
            <Input value={site.name} onChange={(e) => edit({ name: e.target.value })} placeholder="Personal blog" maxLength={60} required />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-[1_1_140px] flex-col gap-1.5 text-[13px] font-medium">
              Big headings become
              <NativeSelect value={site.headingTop} onChange={(e) => edit({ headingTop: Number(e.target.value) })} className="w-full">
                {levels(1, 4)}
              </NativeSelect>
            </label>
            <label className="flex flex-[1_1_140px] flex-col gap-1.5 text-[13px] font-medium">
              Smaller headings become
              <NativeSelect value={site.headingSub} onChange={(e) => edit({ headingSub: Number(e.target.value) })} className="w-full">
                {levels(1, 6)}
              </NativeSelect>
            </label>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex w-28 flex-col gap-1.5 text-[13px] font-medium">
              Tags, at most
              <Input
                type="number"
                min={0}
                max={20}
                value={site.maxTags}
                onChange={(e) => edit({ maxTags: Math.max(0, Math.min(20, Math.round(Number(e.target.value) || 0))) })}
              />
            </label>
            <label className="flex h-9 flex-1 items-center gap-2.5 text-[13px]">
              <Checkbox checked={site.lowercaseTags} onCheckedChange={(on) => edit({ lowercaseTags: on === true })} />
              Lowercase, letters and digits only
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Front matter
            <Textarea
              rows={6}
              value={site.frontMatter}
              onChange={(e) => edit({ frontMatter: e.target.value })}
              maxLength={2000}
              className="bg-muted/40 font-mono text-[13px]"
            />
            <span className="text-xs font-normal text-muted-foreground">Use {"{title}"}, {"{tags}"} and {"{date}"}. Leave it empty for none. Labels are never filled in.</span>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Where to paste it
            <Input value={site.tip} onChange={(e) => edit({ tip: e.target.value })} placeholder="Paste into a new .md file in the blog's posts folder." maxLength={200} />
            <span className="text-xs font-normal text-muted-foreground">Shown under the preview as a reminder.</span>
          </label>
        </div>
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2">
          <span className="text-[13px] font-medium">What you'll copy</span>
          <pre aria-label="Example of the copied Markdown" className="max-h-96 overflow-auto rounded-xl bg-zinc-900 p-4 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-zinc-100">
            {example}
          </pre>
          <p className="text-xs text-muted-foreground">
            From {"clientId" in sample ? `your draft “${sample.title || "Untitled"}”` : "a sample post"}.
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3.5">
        {isNew ? (
          <span />
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (window.confirm(`Remove “${initial.name}”? Drafts headed there just lose that preview tab.`)) {
                void remove({ clientId: initial.clientId });
                onDone();
              }
            }}
          >
            Remove site
          </Button>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit">Save site</Button>
        </div>
      </div>
    </form>
  );
}
