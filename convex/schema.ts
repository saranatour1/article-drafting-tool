import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()), // GitHub login; password users keep theirs in the username component
  }),
  drafts: defineTable({
    userId: v.id("users"),
    // Generated in the browser so a draft has a stable key before the server sees it.
    clientId: v.string(),
    title: v.string(),
    markdown: v.string(),
    tags: v.optional(v.array(v.string())), // optional: drafts saved before tags existed
    updatedAt: v.number(),
  })
    .index("by_user", ["userId", "updatedAt"])
    .index("by_user_client", ["userId", "clientId"]),
});
