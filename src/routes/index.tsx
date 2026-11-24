import { identify } from "@databuddy/sdk";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { getFunctionName } from "convex/server";
import { ConvexAuthNextjsProvider } from "convex-auth-ssr-client";
import { useEffect, useRef } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DraftPane } from "@/components/draft-pane";
import { Home } from "@/components/home";
import { Landing } from "@/components/landing";
import { Settings } from "@/components/settings";
import { VoiceMode } from "@/components/voice-mode";
import { convex } from "@/lib/convex";
import { type Draft, useDrafts } from "@/lib/drafts";
import { type Me, PrefsProvider } from "@/lib/prefs";
import { parseView, useNav } from "@/lib/nav";
import { getSession } from "@/lib/session";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/")({
  validateSearch: parseView,
  loader: () => getSession(),
  component: Page,
});

function Page() {
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
  // re-run the loader so the server-rendered session (account, drafts) catches up.
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && isAuthenticated !== (session.token !== null)) void router.invalidate();
  }, [isLoading, isAuthenticated, session.token, router]);

  // Link this browser's analytics to the signed-in account (its ID and username only).
  useEffect(() => {
    if (signedIn && session.me) identify(session.me.id, { name: session.me.username });
  }, [signedIn, session.me]);
  const drafts = useDrafts(session.token ? session.drafts : undefined);

  if (!signedIn || !session.me) return <Landing />;
  if (!drafts) return <p className="p-8 text-sm text-muted-foreground">Loading drafts…</p>;
  return (
    <PrefsProvider initial={session.me as Me}>
      <Workspace drafts={drafts} />
    </PrefsProvider>
  );
}

function Workspace({ drafts }: { drafts: Draft[] }) {
  const { view, go } = useNav();
  const labels = useQuery(api.labels.list) ?? [];
  const sites = useQuery(api.sites.list) ?? [];

  // A new draft gets its id on the first keystroke; the URL then switches from
  // "new" to that id without remounting the editor mid-sentence.
  const createdKeys = useRef(new Map<string, string>());
  const paneKey = view.d === "new" ? `new-${view.n}` : view.d && (createdKeys.current.get(view.d) ?? view.d);
  const onCreated = (clientId: string) => {
    createdKeys.current.set(clientId, paneKey!);
    go({ ...view, d: clientId, n: undefined }, { replace: true });
  };
  const draft = drafts.find((d) => d.clientId === view.d);

  if (view.s) return <Settings tab={view.s} drafts={drafts} labels={labels} sites={sites} />;
  if (view.d && view.voice) return <VoiceMode key={`voice-${paneKey}`} draft={draft} onCreated={onCreated} />;

  return (
    <div className="flex min-h-screen flex-wrap items-stretch bg-ground lg:flex-nowrap">
      <AppSidebar drafts={drafts} labels={labels} />
      <main className="m-2 flex min-w-0 flex-1 flex-col rounded-[18px] border bg-card shadow-xs lg:h-[calc(100vh-1rem)] lg:overflow-hidden">
        {view.d && (view.d === "new" || draft) ? (
          <DraftPane
            key={`draft-${paneKey}`}
            draft={draft}
            labels={labels}
            sites={sites}
            onCreated={onCreated}
            onDeleted={() => go({})}
          />
        ) : (
          <div className="lg:overflow-y-auto">
            <Home drafts={drafts} labels={labels} sites={sites} />
          </div>
        )}
      </main>
    </div>
  );
}
