import {
  type CookieStore,
  ServerAuthSession,
  createServerAuthChecker,
  setupConvexAuthServer,
} from "@convex-dev/auth/ssr";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { convexUrl } from "./convex";

const cookieOptions = { secure: import.meta.env.PROD };

// POST handlers mounted at /auth/signin, /auth/refresh and /auth/signout.
// Sign-in goes through the server so the refresh token lands in an httpOnly cookie.
export const authHandlers = setupConvexAuthServer({
  convexUrl,
  refreshSession: api.auth.refreshSession,
  signOut: api.auth.signOut,
  signIn: [
    api.auth.signInWithUsernamePassword,
    api.auth.signUpWithUsernamePassword,
    api.auth.completeSignInWithGithub, // GitHub's start goes straight to Convex; only completion mints a session
  ],
  cookieOptions,
});

const cookies: CookieStore = {
  get: getCookie,
  set: setCookie,
  delete: deleteCookie,
};

const isAuthenticated = createServerAuthChecker({
  convexUrl,
  isAuthenticated: api.auth.isAuthenticated,
});

/** Who is signing in, and their drafts, so the first HTML is the real page. */
export async function loadSession() {
  const session = new ServerAuthSession({
    refreshSession: (refreshToken) =>
      new ConvexHttpClient(convexUrl).mutation(api.auth.refreshSession, { refreshToken }),
    cookies,
    cookieOptions,
  });
  const token = await session.getToken(); // refreshes and rewrites cookies if near expiry
  if (!(await isAuthenticated(token))) {
    return { token: null, username: null, drafts: [] };
  }
  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(token!);
  const [me, drafts] = await Promise.all([
    client.query(api.users.me, {}),
    client.query(api.drafts.list, {}),
  ]);
  return { token, username: me?.username ?? null, drafts };
}
