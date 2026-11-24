import { convexCollectionOptions } from "@tanstack/convex-db-collection";
import {
  convexMutationCodec,
  convexOfflineMutation,
} from "@tanstack/convex-db-collection/offline";
import { IndexedDBAdapter, startOfflineExecutor } from "@tanstack/offline-transactions";
import { createCollection, useLiveQuery } from "@tanstack/react-db";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { convex } from "./convex";

export type Draft = {
  clientId: string;
  title: string;
  markdown: string;
  tags: string[];
  /** An idea moves to the drafts when you start writing it up. */
  stage: "idea" | "draft";
  /** Label clientIds: private, never copied out. */
  labels: string[];
  /** Preview tabs besides the plain page; null until picked, so the defaults from Preferences apply. */
  destinations: string[] | null;
  /** Started by talking or typing; null for drafts from before this was kept. */
  source: "voice" | "typed" | null;
  updatedAt: number;
};

function createDraftStore() {
  const drafts = createCollection(
    convexCollectionOptions({
      id: "drafts",
      client: convex,
      query: api.drafts.list,
      queryArgs: {},
      getKey: (d) => d.clientId,
    }),
  );

  // Writes go through a durable outbox in IndexedDB: they apply locally at
  // once, survive reloads while offline, and replay to Convex when back online.
  const executor = startOfflineExecutor({
    mutationCodec: convexMutationCodec,
    collections: { drafts },
    storage: new IndexedDBAdapter("article-drafts-outbox"),
    mutationFns: {
      saveDraft: convexOfflineMutation({
        client: convex,
        mutation: api.drafts.save,
        collections: [drafts],
        getArgs: ({ transaction }) => {
          const { clientId, title, markdown, tags, stage, labels, destinations, source, updatedAt } = transaction
            .mutations[0].modified as Draft;
          return { clientId, title, markdown, tags, stage, labels, destinations, source, updatedAt };
        },
      }),
      deleteDraft: convexOfflineMutation({
        client: convex,
        mutation: api.drafts.remove,
        collections: [drafts],
        getArgs: ({ transaction }) => ({
          clientId: (transaction.mutations[0].original as Draft).clientId,
        }),
      }),
    },
  });

  return {
    drafts,
    /** Writes still waiting for the server (offline, or in flight). */
    pendingCount: () => executor.getPendingCount(),
    saveDraft: executor.createOfflineAction<Draft>({
      mutationFnName: "saveDraft",
      onMutate: (draft) => {
        if (drafts.has(draft.clientId)) {
          drafts.update(draft.clientId, (row) => void Object.assign(row, draft));
        } else {
          drafts.insert(draft);
        }
      },
    }),
    deleteDraft: executor.createOfflineAction<string>({
      mutationFnName: "deleteDraft",
      onMutate: (clientId) => void drafts.delete(clientId),
    }),
  };
}

let store: ReturnType<typeof createDraftStore> | undefined;

/** Browser only: the collection rides Convex's websocket and the outbox lives in IndexedDB. */
export const getDraftStore = () => (store ??= createDraftStore());

/**
 * Live drafts once the local collection is synced; until then the drafts the
 * server rendered with, so SSR and hydration show the same list.
 */
export function useDrafts(ssrDrafts: Draft[] | undefined) {
  const { isAuthenticated } = useConvexAuth();
  const [local, setLocal] = useState<ReturnType<typeof getDraftStore>>();
  useEffect(() => {
    if (isAuthenticated) setLocal(getDraftStore());
  }, [isAuthenticated]);

  const live = useLiveQuery((q) =>
    local
      ? q.from({ d: local.drafts }).orderBy(({ d }) => d.updatedAt, "desc")
      : undefined,
  );
  // A disabled query (server, or before sign-in) reports ready with no data.
  return live.isEnabled && live.isReady ? live.data : ssrDrafts;
}
