import { getAuthUserId } from "@convex-dev/auth/server";
import { vGithubProfile } from "@convex-dev/auth/methods/github/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { prefs } from "./validators";

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

const nullable = v.union(v.string(), v.null());

export const me = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      id: v.id("users"),
      username: nullable, // the password sign-in name, else the GitHub login
      githubLogin: nullable, // set only for accounts made with GitHub
      hasPassword: v.boolean(),
      displayName: nullable,
      avatarUrl: nullable,
      prefs,
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const username = await ctx.runQuery(components.authUsername.public.getUsername, { userId });
    const user = await ctx.db.get("users", userId);
    return {
      id: userId,
      username: username ?? user?.name ?? null,
      githubLogin: user?.name ?? null,
      hasPassword: username !== null, // the username component only holds password accounts
      displayName: user?.displayName ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      prefs: user?.prefs ?? {},
    };
  },
});

async function own(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in");
  const user = await ctx.db.get("users", userId);
  if (user === null) throw new Error("No such user");
  return user;
}

/** An empty name goes back to showing the username. */
export const setDisplayName = mutation({
  args: { displayName: v.string() },
  returns: v.null(),
  handler: async (ctx, { displayName }) => {
    const name = displayName.trim();
    if (name.length > 80) throw new Error("Name too long");
    const user = await own(ctx);
    await ctx.db.patch("users", user._id, { displayName: name || undefined });
    return null;
  },
});

/**
 * Takes the uploaded file, not a URL, so only our own storage ends up as an
 * avatar. Null removes it. Anything but an image up to 5 MB is deleted and the
 * reason returned (a throw would undo the delete).
 */
export const setAvatar = mutation({
  args: { storageId: v.union(v.id("_storage"), v.null()) },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, { storageId }) => {
    const user = await own(ctx);
    if (storageId === null) {
      await ctx.db.patch("users", user._id, { avatarUrl: undefined });
      return null;
    }
    const file = await ctx.db.system.get("_storage", storageId);
    const url = await ctx.storage.getUrl(storageId);
    if (!file?.contentType?.startsWith("image/") || file.size > 5 * 1024 * 1024 || url === null) {
      if (file) await ctx.storage.delete(storageId);
      return "Pick an image up to 5 MB.";
    }
    await ctx.db.patch("users", user._id, { avatarUrl: url });
    await ctx.db.insert("uploads", { userId: user._id, storageId });
    return null;
  },
});

/** Merges into the saved preferences, so each control saves only its own field. */
export const savePrefs = mutation({
  args: { prefs },
  returns: v.null(),
  handler: async (ctx, { prefs: changes }) => {
    if (
      (changes.language?.length ?? 0) > 35 ||
      (changes.destinations?.length ?? 0) > 30 ||
      (changes.checksOff?.length ?? 0) > 20 ||
      [...(changes.destinations ?? []), ...(changes.checksOff ?? [])].some((s) => s.length > 64)
    ) {
      throw new Error("Invalid preferences");
    }
    const user = await own(ctx);
    await ctx.db.patch("users", user._id, { prefs: { ...user.prefs, ...changes } });
    return null;
  },
});
