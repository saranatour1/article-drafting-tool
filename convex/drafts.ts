import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const stage = v.union(v.literal("idea"), v.literal("draft"));

const draft = v.object({
  clientId: v.string(),
  title: v.string(),
  markdown: v.string(),
  tags: v.array(v.string()),
  stage,
  updatedAt: v.number(),
});

export const list = query({
  args: {},
  returns: v.array(draft),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("drafts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
    return rows.map(({ clientId, title, markdown, tags, stage, updatedAt }) => ({
      clientId,
      title,
      markdown,
      tags: tags ?? [],
      stage: stage ?? "draft",
      updatedAt,
    }));
  },
});

async function findOwn(ctx: MutationCtx, clientId: string) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in");
  const existing = await ctx.db
    .query("drafts")
    .withIndex("by_user_client", (q) =>
      q.eq("userId", userId).eq("clientId", clientId),
    )
    .unique();
  return { userId, existing };
}

// The offline outbox replays these with the original idempotencyKey. Both are
// naturally idempotent (last-write-wins on updatedAt, delete-if-present), so
// the key is accepted but no receipts table is needed.
export const save = mutation({
  // tags and stage optional: outbox writes queued before they existed still replay.
  args: {
    ...draft.fields,
    tags: v.optional(v.array(v.string())),
    stage: v.optional(stage),
    idempotencyKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { idempotencyKey: _, ...fields }) => {
    const tags = fields.tags ?? [];
    if (
      fields.title.length > 500 ||
      fields.markdown.length > 500_000 ||
      tags.length > 10 ||
      tags.some((t) => t.length > 50)
    ) {
      throw new Error("Draft too large");
    }
    const { userId, existing } = await findOwn(ctx, fields.clientId);
    if (existing === null) {
      await ctx.db.insert("drafts", { userId, ...fields });
    } else if (fields.updatedAt >= existing.updatedAt) {
      await ctx.db.patch("drafts", existing._id, fields);
    }
    return null;
  },
});

export const remove = mutation({
  args: { clientId: v.string(), idempotencyKey: v.string() },
  returns: v.null(),
  handler: async (ctx, { clientId }) => {
    const { existing } = await findOwn(ctx, clientId);
    if (existing !== null) await ctx.db.delete("drafts", existing._id);
    return null;
  },
});
