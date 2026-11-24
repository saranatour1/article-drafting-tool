// Run: node --test src/lib/platforms.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_EDITOR, PLATFORMS, destinationsFor, editorFor, fillFrontMatter, renderForPlatform, sitePlatform } from "./platforms.ts";

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

test("X: Heading and Subheading become h1 and h2, like its own editor", () => {
  const out = renderForPlatform(platform("x"), "T", md);
  assert.match(out.markdown, /^# Big$/m);
  assert.match(out.markdown, /^## Small$/m);
  assert.match(out.html, /<h1>Big<\/h1>/);
  assert.match(out.html, /<h2>Small<\/h2>/);
});

test("Medium / LinkedIn: two heading sizes", () => {
  for (const id of ["medium", "linkedin"]) {
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

test("editor tools follow the platform", () => {
  assert.equal(editorFor(platform("devto")).maxTags, 4);
  assert.ok(editorFor(platform("devto")).tools.includes("heading"));
  const linkedin = editorFor(platform("linkedin"));
  assert.equal(linkedin.tools[0], "style");
  assert.equal(linkedin.maxTags, undefined);
  assert.ok(!linkedin.tools.includes("code")); // LinkedIn has no inline code
  const x = editorFor(platform("x"));
  assert.deepEqual(x.tools.slice(0, 4), ["bold", "italic", "strike", "style"]);
  assert.equal(x.bodyStyle, "Body");
  assert.ok(!x.tools.includes("code") && !x.tools.includes("heading"));
  // Sites we haven't matched yet get the default tools and no tag field.
  assert.equal(editorFor(platform("medium")), DEFAULT_EDITOR);
});

test("dev.to: published: true when the draft option is off", () => {
  assert.match(renderForPlatform(platform("devto"), "T", "Hi").markdown, /^published: false$/m);
  assert.match(renderForPlatform(platform("devto"), "T", "Hi", [], { devtoDraft: false }).markdown, /^published: true$/m);
});

test("your own site: headings, tags and front matter from its settings", () => {
  const site = {
    clientId: "s1",
    name: "Personal blog",
    headingTop: 2,
    headingSub: 4,
    maxTags: 2,
    lowercaseTags: false,
    frontMatter: "---\ntitle: {title}\ntags: {tags}\ndate: {date}\n---",
    tip: "",
  };
  const out = renderForPlatform(sitePlatform(site), 'A: "b"', md, ["Convex", "convex", "Web Dev", "ai"]);
  assert.deepEqual(out.tags, ["Convex", "Web Dev"]);
  assert.match(out.markdown, /^---\ntitle: "A: \\"b\\""\ntags: Convex, Web Dev\ndate: \d{4}-\d\d-\d\d\n---\n\n## Big$/m);
  assert.match(out.markdown, /^#### Small$/m);
  assert.equal(fillFrontMatter("{date} {nope}", "", [], "2026-11-24"), "2026-11-24 {nope}");
  const bare = sitePlatform({ ...site, frontMatter: " ", maxTags: 0 });
  assert.equal(bare.frontMatter, undefined);
  assert.equal(bare.tags, undefined);
});

test("destinations: plain page first, unknown ids dropped", () => {
  const ids = destinationsFor(["medium", "gone", "plain", "devto"], []).map((p) => p.id);
  assert.deepEqual(ids, ["plain", "medium", "devto"]);
});
