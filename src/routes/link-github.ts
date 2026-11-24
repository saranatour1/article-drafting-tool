import { createFileRoute } from "@tanstack/react-router";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { ConvexHttpClient } from "convex/browser";
import { loadSession } from "@/lib/auth.server";
import { convexUrl } from "@/lib/convex";
import { api } from "../../convex/_generated/api";

// Connecting GitHub to the signed-in account. The sign-in client would treat
// GitHub's redirect as a new sign-in, so the flow runs here instead:
// POST starts it and keeps its state in a short-lived httpOnly cookie, and
// GitHub's redirect comes back as the GET, which redeems it for this user.

const STATE_COOKIE = "link-github-state";
const cookie = { httpOnly: true, sameSite: "lax" as const, secure: import.meta.env.PROD, path: "/link-github" };
const back = (result: string) => new Response(null, { status: 302, headers: { Location: `/?s=account&github=${result}` } });

export const Route = createFileRoute("/link-github")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await loadSession()).token) return new Response("Sign in first", { status: 401 });
        const redirectTo = new URL("/link-github", request.url).href;
        const { redirect, state } = await new ConvexHttpClient(convexUrl).mutation(api.auth.startSignInWithGithub, {
          redirectTo,
        });
        setCookie(STATE_COOKIE, state, { ...cookie, maxAge: 600 });
        return Response.json({ redirect });
      },
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const code = params.get("convexAuthCode"); // @convex-dev/auth's redirect parameter
        const state = getCookie(STATE_COOKIE);
        deleteCookie(STATE_COOKIE, cookie);
        if (!code || !state) return back(params.get("convexAuthError") === "access_denied" ? "cancelled" : "failed");
        const { token } = await loadSession();
        if (!token) return new Response(null, { status: 302, headers: { Location: "/" } });
        const client = new ConvexHttpClient(convexUrl);
        client.setAuth(token);
        return back(await client.mutation(api.githubLink.linkGithub, { code, state }));
      },
    },
  },
});
