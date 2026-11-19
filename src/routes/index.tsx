import { useAuthActions } from "@convex-dev/auth/react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { getFunctionName } from "convex/server";
import { ConvexAuthNextjsProvider } from "convex-auth-ssr-client";
import { FilePlus, LogOut, Trash2 } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { Editor } from "@/components/editor";
import { Preview } from "@/components/preview";
import { TagInput } from "@/components/tag-input";
import { PLATFORMS, editorFor } from "@/lib/platforms";
import { Button } from "@/components/ui/button";
import { convex } from "@/lib/convex";
import { type Draft, getDraftStore, useDrafts } from "@/lib/drafts";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/")({
  loader: () => getSession(),
  component: Home,
});

function Home() {
  const session = Route.useLoaderData();
  return (
    <ConvexAuthNextjsProvider
      client={convex}
      initialToken={session.token}
      isAuthenticatedFunctionName={getFunctionName(api.auth.isAuthenticated)}
    >
      <Gate />
    </ConvexAuthNextjsProvider>
  );
}

function Gate() {
  const session = Route.useLoaderData();
  const { isLoading, isAuthenticated } = useConvexAuth();
  // Until the browser confirms the session, trust what the server rendered.
  const signedIn = isLoading ? session.token !== null : isAuthenticated;

  // Signed in or out in the browser (form, GitHub redirect, sign-out button):
  // re-run the loader so the server-rendered session (username, drafts) catches up.
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && isAuthenticated !== (session.token !== null)) void router.invalidate();
  }, [isLoading, isAuthenticated, session.token, router]);
  const drafts = useDrafts(session.token ? session.drafts : undefined);

  if (!signedIn) return <AuthForm />;
  if (!drafts) return <p className="p-8 text-sm text-muted-foreground">Loading drafts…</p>;
  return <Workspace drafts={drafts} username={session.username} />;
}

function Workspace({ drafts, username }: { drafts: Draft[]; username: string | null }) {
  const [selectedId, setSelectedId] = useState<string | null>(drafts[0]?.clientId ?? null);
  const [paneKey, setPaneKey] = useState(0);
  // Which platform you're writing for: picks the preview tab and the editor's tools.
  const [platformId, setPlatformId] = useState(PLATFORMS[0].id);
  const { signOut } = useAuthActions();

  const open = (id: string | null) => {
    setSelectedId(id);
    setPaneKey((k) => k + 1);
  };

  return (
    <div className="grid h-screen grid-rows-[auto_1fr] lg:grid-cols-[14rem_minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-1">
      <aside className="flex flex-col gap-2 border-b p-3 lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2 px-1 pb-1 font-semibold tracking-tight">
          <img src="/logo.svg" alt="" className="size-6" />
          Article drafts
        </div>
        <Button variant="outline" size="sm" onClick={() => open(null)}>
          <FilePlus /> New draft
        </Button>
        <nav aria-label="Drafts" className="flex max-h-40 flex-col gap-0.5 overflow-y-auto lg:max-h-none lg:flex-1">
          {drafts.map((d) => (
            <button
              key={d.clientId}
              type="button"
              onClick={() => open(d.clientId)}
              aria-current={d.clientId === selectedId ? "page" : undefined}
              className={cn(
                "truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                d.clientId === selectedId && "bg-accent font-medium",
              )}
            >
              {d.title || "Untitled"}
            </button>
          ))}
        </nav>
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="truncate">{username}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Sign out"
            onClick={() => void signOut()}
          >
            <LogOut />
          </Button>
        </div>
      </aside>
      <DraftPane
        key={paneKey}
        author={username ?? "You"}
        platformId={platformId}
        onPlatformChange={setPlatformId}
        draft={drafts.find((d) => d.clientId === selectedId)}
        onCreated={setSelectedId}
        onDeleted={() => open(drafts.find((d) => d.clientId !== selectedId)?.clientId ?? null)}
      />
    </div>
  );
}

/** Editor + previews for one draft. Remounted when switching drafts. */
function DraftPane({
  author,
  platformId,
  onPlatformChange,
  draft,
  onCreated,
  onDeleted,
}: {
  author: string;
  platformId: string;
  onPlatformChange: (id: string) => void;
  draft: Draft | undefined;
  onCreated: (clientId: string) => void;
  onDeleted: () => void;
}) {
  const latest = useRef({
    title: draft?.title ?? "",
    markdown: draft?.markdown ?? "",
    tags: draft?.tags ?? [],
  });
  const [view, setView] = useState(latest.current);
  const preview = useDeferredValue(view);
  const platform = PLATFORMS.find((p) => p.id === platformId) ?? PLATFORMS[0];
  const maxTags = editorFor(platform).maxTags;
  const id = useRef(draft?.clientId);
  const pending = useRef<Draft>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Autosave: debounce keystrokes into one outbox write; never drop the last one.
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    if (pending.current) getDraftStore().saveDraft(pending.current);
    pending.current = undefined;
  }, []);
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  function change(patch: Partial<typeof latest.current>) {
    latest.current = { ...latest.current, ...patch };
    setView(latest.current);
    if (!id.current) {
      id.current = crypto.randomUUID();
      onCreated(id.current);
    }
    pending.current = { clientId: id.current, ...latest.current, updatedAt: Date.now() };
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 500);
  }

  function remove() {
    clearTimeout(timer.current);
    pending.current = undefined;
    if (id.current) getDraftStore().deleteDraft(id.current);
    onDeleted();
  }

  return (
    <>
      <section className="overflow-y-auto border-b px-6 py-8 lg:border-r lg:border-b-0 lg:px-10">
        <div className="mb-2 flex items-start gap-2">
          <input
            value={view.title}
            onChange={(e) => change({ title: e.target.value })}
            placeholder="Title"
            aria-label="Title"
            className="min-w-0 flex-1 bg-transparent text-3xl font-bold outline-none placeholder:text-muted-foreground/60"
          />
          {id.current && (
            <Button variant="ghost" size="icon-sm" aria-label="Delete draft" onClick={remove}>
              <Trash2 />
            </Button>
          )}
        </div>
        {/* Only platforms with tags show the field; the draft keeps its tags either way. */}
        <div className="mb-6 min-h-7">
          {maxTags && <TagInput tags={view.tags} max={maxTags} onChange={(tags) => change({ tags })} />}
        </div>
        <Editor
          initialMarkdown={latest.current.markdown}
          onChange={(markdown) => change({ markdown })}
          platform={platform}
        />
      </section>
      <section className="overflow-y-auto bg-muted/40 px-6 py-8 lg:px-8">
        <Preview
          platformId={platform.id}
          onPlatformChange={onPlatformChange}
          title={preview.title}
          markdown={preview.markdown}
          tags={preview.tags}
          author={author}
        />
      </section>
    </>
  );
}
