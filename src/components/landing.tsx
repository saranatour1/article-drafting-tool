import { useOauth, useSignInWithGithub } from "@convex-dev/auth/methods/github/react";
import { ArrowRight, Check, Lightbulb, Mic, PenLine, Plus, Tag, WifiOff } from "lucide-react";
import { useState } from "react";
import { AuthForm, GithubIcon } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/platforms";
import { REPO_URL, SITE_URL } from "@/lib/site";
import { api } from "../../convex/_generated/api";
import { PlatformMark } from "./bits";

const FEATURES = [
  { icon: Lightbulb, title: "Ideas before drafts", text: "Catch a one-liner by voice or keyboard. Turn it into a draft when it's ready, notes and all." },
  { icon: Tag, title: "Labels just for you", text: "Sort drafts into series, clients or moods. Labels stay here and never get published." },
  { icon: Check, title: "A writing check, no AI", text: "Plain rules catch long sentences, repeated words and a title too long for search." },
  { icon: WifiOff, title: "Keeps working offline", text: "Write in a tunnel or on a plane. Changes wait on your device and sync when you're back." },
];

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
    <div className="flex min-h-screen flex-col bg-ground p-2">
      <div className="flex flex-1 flex-col rounded-[18px] border bg-card shadow-xs">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4.5">
          <div className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
            <img src="/logo.svg" alt="" className="size-7.5" />
            Article drafts
          </div>
          <Button variant="ghost" className="h-11 px-4 text-[15px]" onClick={() => setForm("signIn")}>
            Sign in
          </Button>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-18 px-6 pt-14 pb-22">
          <div className="flex flex-col items-center gap-6.5 text-center">
            <span className="inline-flex h-7.5 items-center gap-2 rounded-full border bg-muted/40 px-3 text-[13px] font-medium text-foreground/80">
              <Mic className="size-3.5" /> For people who think out loud, and people who think on paper
            </span>
            <h1 className="max-w-4xl text-5xl leading-none font-semibold tracking-[-0.045em] text-balance sm:text-7xl">
              Draft your articles, <span className="text-muted-foreground">out loud or by hand.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Talk it through or type it out. Then preview it for dev.to, Medium, LinkedIn, X and more, or just copy clean
              words anywhere.
            </p>
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-3">
                <Button className="h-13 rounded-xl px-6.5 text-base" onClick={() => setForm("signUp")}>
                  Start writing <ArrowRight />
                </Button>
                <Button variant="outline" className="h-13 rounded-xl px-5.5 text-base" onClick={onGithub}>
                  <GithubIcon /> Sign in with GitHub
                </Button>
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div aria-hidden="true" className="flex flex-wrap gap-4">
            <Showcase icon={<Mic />} title="Talk it through" text="Your words appear as you speak.">
              <p className="text-[17px] leading-relaxed">
                So the thing I keep coming back to is that most of my posts start on a walk.{" "}
                <span className="rounded-md bg-violet-100 px-1 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200">
                  I just never had a good place to
                </span>
                <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 bg-violet-700" />
              </p>
              <span className="flex items-center gap-2.5 font-mono text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-violet-700" /> Listening · 00:42
              </span>
            </Showcase>
            <Showcase icon={<PenLine />} title="Write it out" text="A quiet page with the tools tucked away.">
              <span className="flex self-start rounded-lg border p-0.5 text-xs">
                <span className="px-2 py-1 font-medium">Body</span>
                <span className="rounded-md bg-muted px-2 py-1 font-bold">B</span>
                <span className="px-2 py-1 italic">I</span>
                <span className="px-2 py-1 font-mono">/</span>
              </span>
              <span className="text-[22px] leading-tight font-semibold tracking-tight">Notes from a year of writing in public</span>
              <span className="text-base leading-relaxed text-foreground/80">
                Most of what I published started as a messy list in a notebook
                <span className="ml-0.5 inline-block h-4.5 w-0.5 translate-y-1 bg-foreground" />
              </span>
            </Showcase>
          </div>

          <section aria-labelledby="sites-title" className="flex flex-col items-center gap-4.5 text-center">
            <h2 id="sites-title" className="text-[15px] font-medium text-muted-foreground">
              Preview it for the place it's going, or copy plain words for anywhere
            </h2>
            <ul aria-label="Destinations" className="flex max-w-4xl flex-wrap justify-center gap-2.5">
              {PLATFORMS.map((p) => (
                <li key={p.id} className="flex h-11.5 items-center gap-2.5 rounded-full border bg-background pr-4 pl-2 text-base font-medium">
                  <PlatformMark platform={p} className="size-7 rounded-full" />
                  {p.label}
                </li>
              ))}
              <li className="flex h-11.5 items-center gap-2.5 rounded-full border border-dashed pr-4 pl-2 text-base font-medium text-foreground/80">
                <span className="grid size-7 place-items-center rounded-full bg-muted">
                  <Plus className="size-3.5" />
                </span>
                Your own site
              </li>
            </ul>
          </section>

          <section aria-label="What you get" className="flex flex-wrap gap-3.5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex flex-[1_1_220px] flex-col gap-2.5 rounded-2xl border bg-card p-5 shadow-xs">
                <span className="grid size-8.5 place-items-center rounded-lg bg-muted">
                  <Icon className="size-4.5" />
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </section>
        </main>

        <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t px-6 py-5.5 text-[13px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2.5">
            <img src="/logo.svg" alt="" className="size-5.5" />
            <span className="font-medium text-foreground">Article drafts</span>
            <span aria-hidden="true">·</span>
            <span>
              Built with{" "}
              <a href="https://convex.dev" className="font-medium text-foreground underline decoration-border underline-offset-3">
                Convex
              </a>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4.5 gap-y-2">
            <a href={SITE_URL} className="inline-flex h-7 items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 font-medium text-foreground/80">
              <span className="size-1.5 rounded-full bg-green-600" /> Online at {new URL(SITE_URL).host}
            </a>
            <a href={REPO_URL} className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground">
              <GithubIcon /> Source on GitHub
            </a>
            <span suppressHydrationWarning>© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Showcase({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-[1_1_400px] flex-col gap-5 rounded-3xl border bg-muted/40 p-7">
      <div className="flex items-center gap-3.5">
        <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground [&_svg]:size-5">{icon}</span>
        <div className="flex flex-col gap-0.5 text-left">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3.5 rounded-2xl border bg-card px-5.5 py-5 text-left shadow-lg shadow-black/5">{children}</div>
    </div>
  );
}
