// Run: node --test src/lib/link-preview.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { Marked } from "marked";
import { loneLinks, readMeta, withCards } from "./link-preview.ts";

test("reads a page's Open Graph tags", () => {
  const html = `<head><title>ignored</title>
    <meta property="og:site_name" content="X (formerly Twitter)"/>
    <meta content="it&#x27;s a beautiful thing &amp; more" property="og:description">
    <meta property="og:title" content="james (@james406) on X"/>
    <meta name="twitter:title" content="second title loses"/>
    <meta property="og:image" content="/media/a.webp?format=webp&amp;name=large"/>`;
  assert.deepEqual(readMeta(html, "https://x.com/james406/status/1"), {
    title: "james (@james406) on X",
    description: "it's a beautiful thing & more",
    image: "https://x.com/media/a.webp?format=webp&name=large",
    site: "X (formerly Twitter)",
  });
});

test("falls back to <title> and the host; drops non-web images; null without a title", () => {
  const html = `<title>Plain &lt;page&gt;</title><meta name="twitter:image" content="javascript:alert(1)">`;
  assert.deepEqual(readMeta(html, "https://www.example.com/a"), {
    title: "Plain <page>",
    description: undefined,
    image: undefined,
    site: "example.com",
  });
  assert.equal(readMeta("<p>no head</p>", "https://example.com"), null);
});

test("only a bare link on its own line becomes a card, escaped", () => {
  const url = "https://a.example/?x=1&y=2";
  const html = new Marked({ gfm: true }).parse(
    `[${url}](${url})\n\nInline [link](https://b.example) here.\n\n[named](https://c.example)\n\nhttps://d.example\n\n[js](javascript:alert(1))`,
    { async: false },
  );
  assert.deepEqual(loneLinks(html), [url, "https://d.example/"]);

  const out = withCards(html, new Map([[url, { title: "<script>x</script>", site: "a.example", image: "https://a.example/i.png" }]]));
  assert.match(out, /<a class="link-card not-prose" href="https:\/\/a\.example\/\?x=1&amp;y=2"/);
  assert.match(out, /<strong>&lt;script&gt;x&lt;\/script&gt;<\/strong>/);
  assert.match(out, /<p><a href="https:\/\/d\.example">/); // no preview yet: stays a link
  assert.match(out, /Inline <a href="https:\/\/b\.example">link<\/a>/);
});
