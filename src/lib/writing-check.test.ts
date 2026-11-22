// Run: node --test src/lib/writing-check.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkWriting } from "./writing-check.ts";

const issuesOf = (md: string) => checkWriting("A title", md).paragraphs.map((p) => p.issues);

test("a clean paragraph needs no work", () => {
  assert.deepEqual(issuesOf("This reads fine. It ends well!\n\nSo does “this one.”\n\nAnd this 🙂"), [[], [], []]);
});

test("paragraph rules", () => {
  const [p] = issuesOf("so i think the the plan is good ,ok  then,see");
  assert.ok(p.includes("No punctuation at the end"));
  assert.ok(p.includes("A sentence starts with a lowercase letter"));
  assert.ok(issuesOf("That simple! over the next month.")[0].includes("A sentence starts with a lowercase letter"));
  assert.deepEqual(issuesOf("Titles (e.g. this one) and so on, etc. are fine."), [[]]);
  assert.ok(p.includes("Lowercase “i”"));
  assert.ok(p.includes("Repeated word: “the the”"));
  assert.ok(p.includes("Double space"));
  assert.ok(p.includes("Space before punctuation"));
  assert.ok(p.includes("Missing space after punctuation"));
});

test("long sentences and paragraphs", () => {
  const sentence = `${"word ".repeat(34).trim()}.`;
  assert.ok(issuesOf(sentence)[0].includes("A 34-word sentence; try splitting it"));
  assert.deepEqual(issuesOf("Short one here. ".repeat(40)), [[]]); // 120 words is fine
  assert.ok(issuesOf("Short one here now. ".repeat(40))[0].includes("Long paragraph (160 words)"));
  assert.deepEqual(issuesOf("Wink ;) and a smile."), [[]]);
});

test("code, links and images don't trip the rules", () => {
  const md = "Run `npm i` then read [the docs](https://example.com/a.b).\n\n![](https://example.com/x.png)";
  assert.deepEqual(issuesOf(md), [[]]); // the image-only paragraph isn't a paragraph of prose
});

test("lists and headings aren't checked as paragraphs but count as words", () => {
  const out = checkWriting("T", "## a heading\n\n- item one\n- item two\n\nDone.");
  assert.deepEqual(out.paragraphs, [{ start: "Done.", issues: [] }]);
  assert.match(out.article[1].text, /^7 words/);
});

test("article checks", () => {
  assert.deepEqual(checkWriting("", "Hi.").article[0], { ok: false, text: "No title yet" });
  assert.equal(checkWriting("x".repeat(61), "Hi.").article[0].ok, false);
  const long = "The cat sat on the mat. ".repeat(60);
  const out = checkWriting("Cats", long).article;
  assert.equal(out[1].ok, true); // 360 words
  assert.deepEqual(out[2], { ok: false, text: "No headings; add some so readers and search can scan it" });
  assert.match(out[3].text, /easy to read$/);
});
