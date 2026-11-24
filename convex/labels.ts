import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { labelColor } from "./validators";

const MAX_LABELS = 100;
const label = v.object({ clientId: v.string(), name: v.string(), color: labelColor });

export const list = query({
  args: {},
  returns: v.array(label),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("labels")
      .withIndex("by_user_client", (q) => q.eq("userId", userId))
      .take(MAX_LABELS);
    return rows.map(({ clientId, name, color }) => ({ clientId, name, color }));
  },
});

async function findOwn(ctx: MutationCtx, clientId: string) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in");
  const existing = await ctx.db
    .query("labels")
    .withIndex("by_user_client", (q) => q.eq("userId", userId).eq("clientId", clientId))
    .unique();
  return { userId, existing };
}

/** Create or rename/recolor. Drafts point at the clientId, so a rename shows everywhere. */
export const save = mutation({
  args: label.fields,
  returns: v.null(),
  handler: async (ctx, fields) => {
    const name = fields.name.trim();
    if (!name || name.length > 40 || fields.clientId.length > 64) throw new Error("Invalid label");
    const { userId, existing } = await findOwn(ctx, fields.clientId);
    if (existing) {
      await ctx.db.patch("labels", existing._id, { name, color: fields.color });
      return null;
    }
    const count = (
      await ctx.db
        .query("labels")
        .withIndex("by_user_client", (q) => q.eq("userId", userId))
        .take(MAX_LABELS)
    ).length;
    if (count >= MAX_LABELS) throw new Error(`At most ${MAX_LABELS} labels`);
    await ctx.db.insert("labels", { userId, ...fields, name });
    return null;
  },
});

// Drafts keep the deleted id; the app ignores ids it has no label for.
export const remove = mutation({
  args: { clientId: v.string() },
  returns: v.null(),
  handler: async (ctx, { clientId }) => {
    const { existing } = await findOwn(ctx, clientId);
    if (existing) await ctx.db.delete("labels", existing._id);
    return null;
  },
});
