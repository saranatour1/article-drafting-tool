import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { siteFields } from "./validators";

const MAX_SITES = 20;
const site = v.object(siteFields);

export const list = query({
  args: {},
  returns: v.array(site),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("sites")
      .withIndex("by_user_client", (q) => q.eq("userId", userId))
      .take(MAX_SITES);
    return rows.map(({ _id, _creationTime, userId: _, ...fields }) => fields);
  },
});

async function findOwn(ctx: MutationCtx, clientId: string) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in");
  const existing = await ctx.db
    .query("sites")
    .withIndex("by_user_client", (q) => q.eq("userId", userId).eq("clientId", clientId))
    .unique();
  return { userId, existing };
}

const between = (n: number, lo: number, hi: number) => Number.isInteger(n) && n >= lo && n <= hi;

export const save = mutation({
  args: siteFields,
  returns: v.null(),
  handler: async (ctx, fields) => {
    const name = fields.name.trim();
    if (
      !name ||
      name.length > 60 ||
      fields.clientId.length > 64 ||
      !between(fields.headingTop, 1, 4) ||
      !between(fields.headingSub, 1, 6) ||
      !between(fields.maxTags, 0, 20) ||
      fields.frontMatter.length > 2000 ||
      fields.tip.length > 200
    ) {
      throw new Error("Invalid site");
    }
    const { userId, existing } = await findOwn(ctx, fields.clientId);
    if (existing) {
      await ctx.db.patch("sites", existing._id, { ...fields, name });
      return null;
    }
    const count = (
      await ctx.db
        .query("sites")
        .withIndex("by_user_client", (q) => q.eq("userId", userId))
        .take(MAX_SITES)
    ).length;
    if (count >= MAX_SITES) throw new Error(`At most ${MAX_SITES} sites`);
    await ctx.db.insert("sites", { userId, ...fields, name });
    return null;
  },
});

export const remove = mutation({
  args: { clientId: v.string() },
  returns: v.null(),
  handler: async (ctx, { clientId }) => {
    const { existing } = await findOwn(ctx, clientId);
    if (existing) await ctx.db.delete("sites", existing._id);
    return null;
  },
});
