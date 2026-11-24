import { track } from "@databuddy/sdk";
import { Hash, Lock, Mic, PenLine, Send, Trash2, X } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Editor } from "@/components/editor";
import { Preview } from "@/components/preview";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { WritingCheck } from "@/components/writing-check";
import type { Draft } from "@/lib/drafts";
import { type Label, VOICE } from "@/lib/look";
import { newVoice, useNav } from "@/lib/nav";
import { PLAIN, type Site, destinationsFor, editorFor } from "@/lib/platforms";
import { authorName, usePrefs } from "@/lib/prefs";
import { useDraft } from "@/lib/use-draft";
import { cn } from "@/lib/utils";
import { LabelChip } from "./bits";
import { DestinationsDialog } from "./destinations-dialog";
import { LabelPicker } from "./label-picker";

// The preview tab you last picked, kept while you move between drafts.
let lastTab = PLAIN.id;

const WRITING_SIZE = { sm: "[&_.tiptap]:text-[0.9375rem]", md: "", lg: "[&_.tiptap]:text-[1.1875rem]" };

/** Editor + previews for one draft. Remounted when switching drafts. */
export function DraftPane({
  draft,
  labels,
  sites,
  onCreated,
  onDeleted,
}: {
  draft: Draft | undefined;
  labels: Label[];
  sites: Site[];
  onCreated: (clientId: string) => void;
  onDeleted: () => void;
}) {
  const { me, prefs } = usePrefs();
  const { view: url, go } = useNav();
  const dictating = url.dictate === true && !draft;
  const { view, latest, id, saved, change, flush, remove } = useDraft(
    draft,
    { source: dictating ? "voice" : "typed", destinations: null },
    onCreated,
  );
  const preview = useDeferredValue(view);
  const [tab, setTab] = useState(lastTab);
  const [picking, setPicking] = useState(false);

  const destinations = view.destinations ?? prefs.destinations;
  const platforms = destinationsFor(destinations, sites);
  const platform = platforms.find((p) => p.id === tab) ?? PLAIN;
  const tagTakers = platforms.filter((p) => editorFor(p).maxTags);
  const maxTags = Math.max(0, ...tagTakers.map((p) => editorFor(p).maxTags ?? 0));
  const ownLabels = labels.filter((l) => view.labels.includes(l.clientId));
  const idea = view.stage === "idea";

  function startDrafting() {
    change({ stage: "draft" });
    flush();
    track("idea_drafted");
  }

  function dictate() {
    flush(); // the listening view reads the draft from the store
    go(id.current ? { d: id.current, voice: true } : newVoice());
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b py-2.5 pr-3.5 pl-5">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="text-muted-foreground">{idea ? "Ideas" : "Drafts"}</span>
          <span aria-hidden="true" className="text-muted-foreground/60">
            /
          </span>
          <span className="truncate font-medium">{view.title || "Untitled"}</span>
          <span
            className={cn(
              "inline-flex h-5.5 items-center rounded-md px-2 text-xs font-medium",
              idea
                ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-500/15 dark:text-yellow-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200",
            )}
          >
            {idea ? "Idea" : "Draft"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span role="status" className="inline-flex items-center gap-1.5 pr-1 text-xs text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", saved ? "bg-green-600" : "bg-yellow-500")} />
            {saved ? "Saved" : "Saving…"}
          </span>
          <Button variant="outline" className={cn("border", VOICE.soft)} onClick={dictate}>
            <Mic /> Dictate
          </Button>
          {idea ? (
            <Button onClick={startDrafting}>
              <PenLine /> Start drafting
            </Button>
          ) : (
            <Button onClick={() => setPicking(true)}>
              <Send /> Send it anywhere
            </Button>
          )}
          {id.current && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${view.stage}`}
              onClick={() => {
                remove();
                onDeleted();
              }}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-wrap">
        <section
          aria-label="Editor"
          className={cn(
            "min-w-0 flex-[1_1_520px] px-6 py-8 lg:h-full lg:overflow-y-auto lg:px-10",
            prefs.writingFont === "serif" && "[&_.tiptap]:font-serif [&_h1>input]:font-serif",
            WRITING_SIZE[prefs.textSize],
          )}
        >
          <h1 className="mb-4">
            <input
              value={view.title}
              onChange={(e) => change({ title: e.target.value })}
              placeholder={idea ? "Your idea in a line" : "Title"}
              aria-label="Title"
              className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60 sm:text-4xl"
            />
          </h1>

          <div className="mb-6 flex flex-col gap-2.5 rounded-xl border bg-muted/40 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex w-28 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Lock className="size-3.5" /> Labels
              </span>
              {ownLabels.map((l) => (
                <LabelChip key={l.clientId} label={l}>
                  <button
                    type="button"
                    aria-label={`Remove label ${l.name}`}
                    onClick={() => change({ labels: latest.current.labels.filter((x) => x !== l.clientId) })}
                    className="-mr-1 grid size-4.5 place-items-center rounded opacity-70 hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                </LabelChip>
              ))}
              <LabelPicker
                labels={labels}
                value={view.labels}
                onChange={(ids) => change({ labels: ids })}
                onManage={() => go({ s: "labels" })}
              />
              <span className="ml-auto text-xs text-muted-foreground">Only you see these</span>
            </div>
            {maxTags > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t pt-2.5">
                <span className="inline-flex w-28 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Hash className="size-3.5" /> Publish tags
                </span>
                <div className="min-w-48 flex-1">
                  <TagInput tags={view.tags} max={maxTags} onChange={(tags) => change({ tags })} />
                </div>
                <span className="text-xs text-muted-foreground">
                  Sent to{" "}
                  {tagTakers
                    .map((p) => `${p.label} (${Math.min(view.tags.length, editorFor(p).maxTags ?? 0)} of ${editorFor(p).maxTags})`)
                    .join(" and ")}
                </span>
              </div>
            )}
          </div>

          <Editor
            initialMarkdown={latest.current.markdown}
            onChange={(markdown) => change({ markdown })}
            platform={platform}
            dictate={dictating}
          />
        </section>

        <section
          aria-label="Preview"
          className="min-w-0 flex-[1_1_400px] border-t bg-muted/40 px-6 py-6 lg:h-full lg:overflow-y-auto lg:border-t-0 lg:border-l lg:px-6"
        >
          {idea ? (
            <p className="max-w-sm text-sm text-muted-foreground">
              This is still an idea. Jot down notes, or dictate them; when you're ready, Start drafting moves it to your
              drafts, notes and all, and shows how it'll look on each site.
            </p>
          ) : (
            <>
              {prefs.checks && <WritingCheck title={preview.title} markdown={preview.markdown} off={prefs.checksOff} />}
              <Preview
                platforms={platforms}
                platformId={platform.id}
                onPlatformChange={(next) => {
                  lastTab = next;
                  setTab(next);
                }}
                onAdd={() => setPicking(true)}
                title={preview.title}
                markdown={preview.markdown}
                tags={preview.tags}
                author={authorName(me)}
                options={{ devtoDraft: prefs.devtoDraft }}
              />
            </>
          )}
        </section>
      </div>

      <DestinationsDialog
        open={picking}
        onOpenChange={setPicking}
        value={destinations}
        sites={sites}
        onSave={(ids) => change({ destinations: ids })}
        onAddSite={() => {
          flush();
          go({ s: "labels" });
        }}
      />
    </div>
  );
}
