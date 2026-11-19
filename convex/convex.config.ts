import { defineApp } from "convex/server";
import { v } from "convex/values";
import auth from "@convex-dev/auth/convex.config.js";
import authGithub from "@convex-dev/auth/components/github/convex.config.js";
import authPassword from "@convex-dev/auth/components/password/convex.config.js";
import authUsername from "@convex-dev/auth/components/username/convex.config.js";

const app = defineApp({
  env: {
    AUTH_GITHUB_CLIENT_ID: v.string(),
    AUTH_GITHUB_CLIENT_SECRET: v.string(),
    // Where the app is served, comma-separated; OAuth only redirects back here.
    APP_ORIGINS: v.optional(v.string()),
  },
});

app.use(auth);
app.use(authPassword);
app.use(authUsername);
// GitHub's callback: <CONVEX_SITE_URL>/oauth/github/callback
app.use(authGithub, {
  httpPrefix: "/oauth/github",
  env: {
    CLIENT_ID: app.env.AUTH_GITHUB_CLIENT_ID,
    CLIENT_SECRET: app.env.AUTH_GITHUB_CLIENT_SECRET,
  },
});

export default app;
