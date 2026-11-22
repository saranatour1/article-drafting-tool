import { useOauth, useSignInWithGithub } from "@convex-dev/auth/methods/github/react";
import { useState } from "react";
import { AuthForm, GithubIcon } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/platforms";
import { api } from "../../convex/_generated/api";

/** What signed-out visitors see; Sign in / Start writing swap in the auth form. */
export function Landing() {
  const [form, setForm] = useState<"signIn" | "signUp" | null>(null);
  const { signIn: signInWithGithub } = useSignInWithGithub(api.auth);
  const { flowError } = useOauth(); // a failed GitHub redirect: the form explains it
  const [error, setError] = useState<string | null>(null);

  if (form || flowError) return <AuthForm initialMode={form ?? "signIn"} />;

  async function onGithub() {
    setError(null);
    const result = await signInWithGithub();
    if (result.status === "redirect") return;
    console.error("GitHub sign-in failed to start:", result.userError.cause);
    setError("Couldn't start GitHub sign-in. Please try again.");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-2.5 font-semibold tracking-tight">
          <img src="/logo.svg" alt="" className="size-7" />
          Article drafts
        </div>
        <Button variant="ghost" className="h-11 px-3.5 text-[15px]" onClick={() => setForm("signIn")}>
          Sign in
        </Button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 pt-16 pb-24 text-center">
        <h1 className="text-5xl leading-none font-bold tracking-[-0.045em] sm:text-7xl lg:text-8xl">
          Draft your articles
        </h1>
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg text-muted-foreground">Preview and copy them for these sites</p>
          <ul aria-label="Supported sites" className="flex flex-wrap justify-center gap-3">
            {PLATFORMS.map((p) => (
              <li key={p.id} className="flex h-13 items-center gap-2.5 rounded-full border px-5.5 text-lg font-medium">
                {LOGOS[p.id]}
                {p.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-3">
            <Button className="h-13 rounded-xl px-7 text-base" onClick={() => setForm("signUp")}>
              Start writing
            </Button>
            <Button variant="outline" className="h-13 rounded-xl px-6 text-base" onClick={onGithub}>
              <GithubIcon /> Sign in with GitHub
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl justify-between gap-3 border-t px-6 py-6 text-sm text-muted-foreground">
        <span>Article drafts</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

// Brand marks from Simple Icons (CC0), keyed by platform id.
const logo = (d: string, size: string) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={size}>
    <path d={d} />
  </svg>
);
const LOGOS: Record<string, React.ReactNode> = {
  devto: logo(
    "M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.3zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z",
    "size-5.5",
  ),
  x: logo(
    "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
    "size-4.5",
  ),
  medium: logo(
    "M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z",
    "size-5.5",
  ),
  linkedin: logo(
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    "size-5",
  ),
};
