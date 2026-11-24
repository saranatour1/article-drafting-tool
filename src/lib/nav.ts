import { useNavigate, useSearch } from "@tanstack/react-router";

export type SettingsTab = "account" | "preferences" | "labels";

/**
 * Where you are, kept in the URL so Back works: a draft (`d`, or "new" with a
 * nonce `n`), dictating into it (`voice`), a settings page (`s`), or Home,
 * optionally filtered by a label.
 */
export type View = {
  d?: string;
  n?: number;
  voice?: boolean;
  /** Open the draft with its mic already listening. */
  dictate?: boolean;
  s?: SettingsTab;
  label?: string;
  /** How connecting GitHub went, from src/routes/link-github.ts. */
  github?: string;
};

export function parseView(raw: Record<string, unknown>): View {
  return {
    d: typeof raw.d === "string" ? raw.d : undefined,
    n: typeof raw.n === "number" ? raw.n : undefined,
    voice: raw.voice === true ? true : undefined,
    dictate: raw.dictate === true ? true : undefined,
    s: raw.s === "account" || raw.s === "preferences" || raw.s === "labels" ? raw.s : undefined,
    label: typeof raw.label === "string" ? raw.label : undefined,
    github: typeof raw.github === "string" ? raw.github : undefined,
  };
}

export const newDraft = (): View => ({ d: "new", n: Date.now() });
export const newVoice = (): View => ({ d: "new", n: Date.now(), voice: true });
/** Speak: the full-screen listening view, or the editor with its mic on, as Preferences say. */
export const speak = (fullscreen: boolean): View => (fullscreen ? newVoice() : { ...newDraft(), dictate: true });

export function useNav() {
  const navigate = useNavigate();
  const view = useSearch({ from: "/" });
  return {
    view,
    go: (next: View, options: { replace?: boolean } = {}) => void navigate({ to: "/", search: next, ...options }),
  };
}
