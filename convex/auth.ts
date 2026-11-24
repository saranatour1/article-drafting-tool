import { setupConvexAuth } from "@convex-dev/auth/server";
import { setupGithub } from "@convex-dev/auth/methods/github/server";
import { setupUsernamePassword } from "@convex-dev/auth/methods/username-password/server";
import { components, internal } from "./_generated/api";
import { env } from "./_generated/server";

const auth = setupConvexAuth({ component: components.auth });
export const { signOut, refreshSession, isAuthenticated } = auth;

export const { signUpWithUsernamePassword, signInWithUsernamePassword, changePassword } =
  setupUsernamePassword(auth, {
    component: components.authPassword,
    usernameComponent: components.authUsername,
  }).attachUserCallbacks({ createUser: internal.users.createUser });

export const { startSignInWithGithub, completeSignInWithGithub } = setupGithub(auth, {
  component: components.authGithub,
  allowedRedirectOrigins: (env.APP_ORIGINS ?? "http://localhost:3000").split(","),
}).attachUserCallbacks({ createUser: internal.users.createUser });
