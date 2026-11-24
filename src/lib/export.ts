import { strToU8, zipSync } from "fflate";
import type { Draft } from "./drafts";

const slug = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** Every draft and idea as a Markdown file, labels and tags in the front matter. */
export function exportFiles(drafts: Draft[], labelName: (clientId: string) => string | undefined) {
  const files: Record<string, string> = {};
  for (const d of drafts) {
    const folder = d.stage === "idea" ? "ideas" : "drafts";
    const base = `${folder}/${slug(d.title) || "untitled"}`;
    let path = `${base}.md`;
    for (let i = 2; path in files; i++) path = `${base}-${i}.md`;
    const labels = d.labels.map(labelName).filter((n) => n !== undefined);
    const front = [
      `title: ${JSON.stringify(d.title || "Untitled")}`,
      `updated: ${new Date(d.updatedAt).toISOString()}`,
      labels.length > 0 && `labels: ${JSON.stringify(labels)}`,
      d.tags.length > 0 && `tags: ${JSON.stringify(d.tags)}`,
    ].filter(Boolean);
    files[path] = `---\n${front.join("\n")}\n---\n\n${d.markdown}`;
  }
  return files;
}

export function exportZip(drafts: Draft[], labelName: (clientId: string) => string | undefined) {
  const files = exportFiles(drafts, labelName);
  const zip = zipSync(Object.fromEntries(Object.entries(files).map(([path, text]) => [path, strToU8(text)])));
  return new Blob([zip as BlobPart], { type: "application/zip" });
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
