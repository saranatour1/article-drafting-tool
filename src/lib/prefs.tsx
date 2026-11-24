import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import type { Infer } from "convex/values";
import { type ReactNode, createContext, useContext, useEffect } from "react";
import { api } from "../../convex/_generated/api";
import type { prefs as prefsValidator } from "../../convex/validators";

export type Me = NonNullable<FunctionReturnType<typeof api.users.me>>;
type SavedPrefs = Infer<typeof prefsValidator>;
export type Prefs = Required<SavedPrefs>;

export const DEFAULT_PREFS: Prefs = {
  theme: "light",
  writingFont: "sans",
  textSize: "md",
  startWith: "ask",
  ideaBox: true,
  language: "", // the browser's
  listen: "auto",
  checks: true,
  checksOff: [],
  // The four sites the app previewed before destinations were a choice.
  destinations: ["devto", "medium", "linkedin", "x"],
  devtoDraft: true,
};

type Context = { me: Me; prefs: Prefs; savePrefs: (changes: SavedPrefs) => void };
const PrefsContext = createContext<Context | null>(null);

/** The signed-in account and its preferences, live, starting from what the server rendered. */
export function PrefsProvider({ initial, children }: { initial: Me; children: ReactNode }) {
  const me = useQuery(api.users.me) ?? initial;
  const save = useMutation(api.users.savePrefs).withOptimisticUpdate((store, { prefs }) => {
    const current = store.getQuery(api.users.me, {});
    if (current) store.setQuery(api.users.me, {}, { ...current, prefs: { ...current.prefs, ...prefs } });
  });
  const prefs = { ...DEFAULT_PREFS, ...me.prefs };
  useTheme(prefs.theme);
  return (
    <PrefsContext.Provider value={{ me, prefs, savePrefs: (changes) => void save({ prefs: changes }) }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  const context = useContext(PrefsContext);
  if (!context) throw new Error("usePrefs outside PrefsProvider");
  return context;
}

/** The name previews show as the author. */
export const authorName = (me: Me) => me.displayName ?? me.username ?? "You";

// The root's inline script reads the stored theme before first paint, so a dark page doesn't flash light.
function useTheme(theme: Prefs["theme"]) {
  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch {} // private mode: the theme still applies, it just flashes on the next load
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && media.matches));
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
}
