import { getAuthUserId } from "@convex-dev/auth/server";
import { vGithubProfile } from "@convex-dev/auth/methods/github/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation, query } from "./_generated/server";

/** One callback for every sign-in method. */
export const createUser = internalMutation({
  args: {
    method: v.union(
      v.object({ name: v.literal("usernamePassword"), profile: v.object({}) }),
      v.object({ name: v.literal("github"), profile: vGithubProfile }),
    ),
  },
  returns: v.id("users"),
  handler: async (ctx, { method }) =>
    // The GitHub profile only arrives here, so keep the login for display.
    await ctx.db.insert("users", method.name === "github" ? { name: method.profile.login } : {}),
});

export const me = query({
  args: {},
  returns: v.union(v.null(), v.object({ id: v.id("users"), username: v.union(v.string(), v.null()) })),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const username = await ctx.runQuery(components.authUsername.public.getUsername, { userId });
    const user = await ctx.db.get("users", userId);
    return { id: userId, username: username ?? user?.name ?? null };
  },
});
