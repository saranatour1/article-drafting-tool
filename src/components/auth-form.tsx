import { useOauth, useSignInWithGithub } from "@convex-dev/auth/methods/github/react";
import { track } from "@databuddy/sdk";
import {
  useSignInWithUsernamePassword,
  useSignUpWithUsernamePassword,
} from "@convex-dev/auth/methods/username-password/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../convex/_generated/api";

export function AuthForm() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const { signIn, pending: signingIn } = useSignInWithUsernamePassword(api.auth);
  const { signUp, pending: signingUp } = useSignUpWithUsernamePassword(api.auth);
  const { signIn: signInWithGithub } = useSignInWithGithub(api.auth);
  const { flowError } = useOauth(); // set when the redirect back from GitHub fails
  const [error, setError] = useState<string | null>(null);
  const pending = signingIn || signingUp;

  async function onGithub() {
    setError(null);
    const result = await signInWithGithub();
    if (result.status === "redirect") return;
    console.error("GitHub sign-in failed to start:", result.userError.cause);
    setError("Couldn't start GitHub sign-in. Please try again.");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const creds = {
      username: String(form.get("username")),
      password: String(form.get("password")),
    };
    const result = mode === "signIn" ? await signIn(creds) : await signUp(creds);
    if (result.status === "complete") {
      if (mode === "signUp") track("signup_completed", { method: "password" });
      return;
    }
    const err = result.userError;
    if (err.error === "OTHER_ERROR") console.error(err.cause);
    setError(MESSAGES[err.error] ?? "Something went wrong. Please try again.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <img src="/logo.svg" alt="" className="mb-4 size-10" />
        <h1 className="text-2xl font-semibold">Article drafts</h1>
        <p className="text-sm text-muted-foreground">
          Write once, preview it for dev.to, X and Medium.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" autoComplete="username" required disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            required
            disabled={pending}
          />
        </div>
        {(error || flowError) && (
          <p role="alert" className="text-sm text-destructive">
            {error ?? OAUTH_MESSAGES[flowError!.error]}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {mode === "signIn" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" className="w-full" onClick={onGithub} disabled={pending}>
        <GithubIcon /> Continue with GitHub
      </Button>
      <button
        type="button"
        className="text-sm text-muted-foreground underline underline-offset-4"
        onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
      >
        {mode === "signIn" ? "No account? Create one" : "Have an account? Sign in"}
      </button>
    </main>
  );
}

const OAUTH_MESSAGES: Record<string, string> = {
  ACCESS_DENIED: "GitHub sign-in was cancelled.",
  EXPIRED: "That sign-in took too long. Please try again.",
  INVALID_FLOW: "This sign-in can't be completed here. Please try again.",
  OTHER_ERROR: "Something went wrong during GitHub sign-in. Please try again.",
};

// lucide dropped brand icons, so the GitHub mark is inlined.
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  );
}

const MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: "No account exists with that username.",
  INVALID_CREDENTIALS: "Incorrect username or password.",
  USERNAME_TAKEN: "That username is already taken.",
  USERNAME_TOO_SHORT: "Username is too short.",
  USERNAME_TOO_LONG: "Username is too long.",
  USERNAME_HAS_SURROUNDING_WHITESPACE: "Username can't start or end with a space.",
  USERNAME_HAS_INVALID_CHARACTERS: "Username contains characters that aren't allowed.",
  PASSWORD_TOO_SHORT: "Password is too short.",
  PASSWORD_TOO_LONG: "Password is too long.",
  PASSWORD_HAS_SURROUNDING_WHITESPACE: "Password can't start or end with a space.",
  PASSWORD_TOO_COMMON: "That password is too common. Pick another.",
  RATE_LIMITED: "Too many attempts. Wait a moment and try again.",
};
