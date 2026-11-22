import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Pasted and dropped images: the browser uploads the file, then trades its
// storage id for a public URL that the draft's markdown keeps.

const MAX_BYTES = 10 * 1024 * 1024;

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    if ((await getAuthUserId(ctx)) === null) throw new Error("Not signed in");
    return await ctx.storage.generateUploadUrl();
  },
});

// The upload URL takes any file, so anything but an image up to 10 MB is
// deleted and gets null. Returning, not throwing: a throw would undo the delete.
export const imageUrl = mutation({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { storageId }) => {
    if ((await getAuthUserId(ctx)) === null) throw new Error("Not signed in");
    const file = await ctx.db.system.get("_storage", storageId);
    if (file === null) return null;
    if (!file.contentType?.startsWith("image/") || file.size > MAX_BYTES) {
      await ctx.storage.delete(storageId);
      return null;
    }
    return await ctx.storage.getUrl(storageId);
  },
});
