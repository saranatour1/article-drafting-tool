// Run: node --test src/lib/platforms.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { PLATFORMS, renderForPlatform } from "./platforms.ts";

const platform = (id: string) => PLATFORMS.find((p) => p.id === id)!;
const md = "# Big\n\nIntro\n\n### Small\n\n```\n# not a heading\n```\n\n<img src=x onerror=alert(1)>\n";

test("dev.to: front matter, h1 demoted, code untouched", () => {
  const out = renderForPlatform(platform("devto"), 'Say "hi"', md);
  assert.ok(out.markdown.startsWith('---\ntitle: "Say \\"hi\\""\npublished: false'));
  assert.match(out.markdown, /^## Big$/m);
  assert.match(out.markdown, /^### Small$/m);
  assert.match(out.markdown, /^# not a heading$/m);
  assert.ok(!out.html.includes("---"));
});

test("dev.to tags: normalized, deduped, at most 4, in front matter", () => {
  const out = renderForPlatform(platform("devto"), "T", "Hi", ["Convex", "Web Dev", "#ai!", "convex", "rust", "go"]);
  assert.deepEqual(out.tags, ["convex", "webdev", "ai", "rust"]);
  assert.match(out.markdown, /^tags: convex, webdev, ai, rust$/m);
  assert.deepEqual(renderForPlatform(platform("medium"), "T", "Hi", ["convex"]).tags, []);
});

test("Medium / X / LinkedIn: two heading sizes", () => {
  for (const id of ["medium", "x", "linkedin"]) {
    const out = renderForPlatform(platform(id), "T", md);
    assert.match(out.markdown, /^## Big$/m);
    assert.match(out.markdown, /^### Small$/m);
    assert.equal(out.markdown.includes("---"), false);
  }
});

test("raw HTML is escaped in the preview", () => {
  const { html } = renderForPlatform(platform("medium"), "T", md);
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;img src=x"));
});
