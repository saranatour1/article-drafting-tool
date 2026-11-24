// Run: node --test src/lib/text.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { ago, excerpt, initials, wordCount } from "./text.ts";

test("excerpts and counts skip markdown", () => {
  const md = "## Heading\n\nSome **bold** and a [link](https://x.y).\n\n```\ncode here\n```\n\n- item";
  assert.equal(excerpt(md), "Heading Some bold and a link. item");
  assert.equal(wordCount(md), 7);
  assert.equal(excerpt("one two three four", 9), "one two…");
});

test("relative times", () => {
  const now = 1_000_000_000_000;
  assert.equal(ago(now - 10_000, now), "just now");
  assert.equal(ago(now - 20 * 60_000, now), "20 minutes ago");
  assert.equal(ago(now - 26 * 3_600_000, now), "yesterday");
  assert.equal(ago(now - 9 * 86_400_000, now), "last week");
});

test("initials", () => {
  assert.equal(initials("Ada Lovelace Byron"), "AL");
  assert.equal(initials(""), "?");
});
