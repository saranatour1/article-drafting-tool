import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";

/**
 * Delete the signed-in account. Sign-in goes first, in this transaction: the
 * username is freed, the stored password hash is overwritten with a random one,
 * every session ends and the profile is emptied. The writing is then deleted in
 * batches by `purge`.
 *
 * The auth components can't delete a password row or a GitHub link, so what
 * remains is an empty user with no username: signing in with GitHub again
 * lands in a fresh, empty account.
 */
export const deleteAccount = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const { deleted } = await ctx.runMutation(components.authUsername.public.deleteUsername, { userId });
    if (deleted) {
      await ctx.runMutation(components.authPassword.public._internal_dangerous_setPassword, {
        userId,
        password: `${crypto.randomUUID()}${crypto.randomUUID()}`,
        minimumLength: 8,
      });
    }
    const sessions = await ctx.runQuery(components.auth.public.listSessions, { userId });
    await ctx.runMutation(components.auth.public.revokeSessions, { sessionIds: sessions.map((s) => s.sessionId) });
    if (await ctx.db.get("users", userId)) await ctx.db.replace("users", userId, {});
    await ctx.scheduler.runAfter(0, internal.account.purge, { userId });
    return null;
  },
});

// Drafts can be large, so fewer per batch keeps each run under the read limits.
const BATCH = { drafts: 20, rest: 100 };

/** One batch of the account's rows and uploaded files; schedules itself until none are left. */
export const purge = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    const drafts = await ctx.db.query("drafts").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH.drafts);
    const labels = await ctx.db.query("labels").withIndex("by_user_client", (q) => q.eq("userId", userId)).take(BATCH.rest);
    const sites = await ctx.db.query("sites").withIndex("by_user_client", (q) => q.eq("userId", userId)).take(BATCH.rest);
    const uploads = await ctx.db.query("uploads").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH.rest);
    for (const d of drafts) await ctx.db.delete("drafts", d._id);
    for (const l of labels) await ctx.db.delete("labels", l._id);
    for (const s of sites) await ctx.db.delete("sites", s._id);
    for (const u of uploads) {
      if (await ctx.db.system.get("_storage", u.storageId)) await ctx.storage.delete(u.storageId);
      await ctx.db.delete("uploads", u._id);
    }
    const more =
      drafts.length === BATCH.drafts ||
      labels.length === BATCH.rest ||
      sites.length === BATCH.rest ||
      uploads.length === BATCH.rest;
    if (more) await ctx.scheduler.runAfter(0, internal.account.purge, { userId });
    return null;
  },
});
