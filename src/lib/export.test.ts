// Run: node --test src/lib/export.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { unzipSync, strFromU8 } from "fflate";
import { exportFiles, exportZip } from "./export.ts";

const draft = (title: string, extra = {}) => ({
  clientId: title,
  title,
  markdown: "Body",
  tags: [],
  stage: "draft" as const,
  labels: [],
  destinations: null,
  source: null,
  updatedAt: 0,
  ...extra,
});

test("one file per draft, ideas apart, same titles kept apart", () => {
  const files = exportFiles(
    [draft("Hello, World!"), draft("Hello world"), draft(""), draft("Café idea", { stage: "idea", labels: ["l1", "gone"], tags: ["ai"] })],
    (id) => (id === "l1" ? "Series" : undefined),
  );
  assert.deepEqual(Object.keys(files), ["drafts/hello-world.md", "drafts/hello-world-2.md", "drafts/untitled.md", "ideas/cafe-idea.md"]);
  assert.equal(
    files["ideas/cafe-idea.md"],
    '---\ntitle: "Café idea"\nupdated: 1970-01-01T00:00:00.000Z\nlabels: ["Series"]\ntags: ["ai"]\n---\n\nBody',
  );
});

test("the zip holds those files", async () => {
  const zip = new Uint8Array(await exportZip([draft("A")], () => undefined).arrayBuffer());
  assert.match(strFromU8(unzipSync(zip)["drafts/a.md"]), /^---\ntitle: "A"/);
});
