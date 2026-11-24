import { track } from "@databuddy/sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Draft, getDraftStore } from "./drafts";

export type DraftFields = Omit<Draft, "clientId" | "updatedAt">;

/**
 * One draft being edited. Nothing is stored until the first change, which
 * creates the draft; after that keystrokes are debounced into one outbox write,
 * and the last one is never dropped. Call flush() before handing the draft to
 * another view, so that view starts from the latest text.
 */
export function useDraft(
  draft: Draft | undefined,
  start: Pick<DraftFields, "source" | "destinations"> & { stage?: Draft["stage"] },
  onCreated: (clientId: string) => void,
) {
  const latest = useRef<DraftFields>({
    title: draft?.title ?? "",
    markdown: draft?.markdown ?? "",
    tags: draft?.tags ?? [],
    stage: draft?.stage ?? start.stage ?? "draft",
    labels: draft?.labels ?? [],
    destinations: draft ? draft.destinations : start.destinations,
    source: draft ? draft.source : start.source,
  });
  const [view, setView] = useState(latest.current);
  const [saved, setSaved] = useState(true);
  const id = useRef(draft?.clientId);
  const pending = useRef<Draft>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    if (pending.current) getDraftStore().saveDraft(pending.current);
    pending.current = undefined;
    setSaved(true);
  }, []);
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  function change(patch: Partial<DraftFields>) {
    latest.current = { ...latest.current, ...patch };
    setView(latest.current);
    if (!id.current) {
      id.current = crypto.randomUUID();
      onCreated(id.current);
      track(latest.current.stage === "idea" ? "idea_created" : "draft_created", { source: latest.current.source ?? "typed" });
    }
    pending.current = { clientId: id.current, ...latest.current, updatedAt: Date.now() };
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 500);
  }

  function remove() {
    clearTimeout(timer.current);
    pending.current = undefined;
    if (id.current) getDraftStore().deleteDraft(id.current);
  }

  return { view, latest, id, saved, change, flush, remove };
}
