import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { labelColor, prefs, siteFields } from "./validators";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()), // GitHub login; password users keep theirs in the username component
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    prefs: v.optional(prefs),
  }),
  drafts: defineTable({
    userId: v.id("users"),
    // Generated in the browser so a draft has a stable key before the server sees it.
    clientId: v.string(),
    title: v.string(),
    markdown: v.string(),
    tags: v.optional(v.array(v.string())), // optional: drafts saved before tags existed
    // An idea becomes a draft by changing stage; missing means a draft saved before ideas existed.
    stage: v.optional(v.union(v.literal("idea"), v.literal("draft"))),
    labels: v.optional(v.array(v.string())), // label clientIds; private, never copied out
    destinations: v.optional(v.array(v.string())), // preview tabs: platform ids or site clientIds
    source: v.optional(v.union(v.literal("voice"), v.literal("typed"))), // how it was started
    updatedAt: v.number(),
  })
    .index("by_user", ["userId", "updatedAt"])
    .index("by_user_client", ["userId", "clientId"]),
  labels: defineTable({
    userId: v.id("users"),
    clientId: v.string(),
    name: v.string(),
    color: labelColor,
  }).index("by_user_client", ["userId", "clientId"]),
  sites: defineTable({ userId: v.id("users"), ...siteFields }).index("by_user_client", ["userId", "clientId"]),
});
