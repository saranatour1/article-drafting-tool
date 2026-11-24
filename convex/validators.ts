import { v } from "convex/values";

// Shared by the schema and the functions that write these fields.

export const labelColor = v.union(
  v.literal("violet"),
  v.literal("blue"),
  v.literal("teal"),
  v.literal("green"),
  v.literal("yellow"),
  v.literal("orange"),
  v.literal("pink"),
  v.literal("gray"),
);

/** Every field optional: a missing one means the default, and older rows stay valid. */
export const prefs = v.object({
  theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
  writingFont: v.optional(v.union(v.literal("sans"), v.literal("serif"))),
  textSize: v.optional(v.union(v.literal("sm"), v.literal("md"), v.literal("lg"))),
  startWith: v.optional(v.union(v.literal("speak"), v.literal("write"), v.literal("ask"))),
  ideaBox: v.optional(v.boolean()),
  language: v.optional(v.string()), // dictation; missing means the browser's
  listen: v.optional(v.union(v.literal("auto"), v.literal("record"))),
  checks: v.optional(v.boolean()),
  checksOff: v.optional(v.array(v.string())), // writing-check rules turned off
  destinations: v.optional(v.array(v.string())), // preview tabs a new draft starts with
  devtoDraft: v.optional(v.boolean()), // published: false in dev.to's front matter
});

/** A destination the user taught the app: how its headings, tags and front matter look. */
export const siteFields = {
  clientId: v.string(),
  name: v.string(),
  headingTop: v.number(), // what a draft's big headings (#, ##) become
  headingSub: v.number(), // and its smaller ones
  maxTags: v.number(),
  lowercaseTags: v.boolean(),
  frontMatter: v.string(), // template with {title}, {tags}, {date}
  tip: v.string(),
};
