import { type Token, lexer } from "marked";

/**
 * A rule-based writing check, no AI: each paragraph is fine or needs work, with
 * the reasons, plus a few whole-article checks that matter for search.
 * The rules are plain English heuristics, so expect the odd false alarm.
 */
export type WritingCheck = {
  article: { ok: boolean; text: string }[];
  paragraphs: { start: string; issues: string[] }[];
};

const LONG_SENTENCE = 30; // words
const LONG_PARAGRAPH = 150; // words
const SEARCH_TITLE = 60; // characters search results show before cutting
const THIN = 300; // words: shorter pages tend to rank poorly
const WPM = 238; // average silent reading speed

// Prose only: code becomes a placeholder word, images drop out.
function plain(tokens: Token[] = []): string {
  return tokens
    .map((t) => {
      if (t.type === "image") return "";
      if (t.type === "codespan") return "code";
      if (t.type === "br") return "\n";
      if ("tokens" in t && t.tokens?.length) return plain(t.tokens);
      return "text" in t ? String(t.text) : "";
    })
    .join("");
}

const words = (s: string) => s.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w));

// English syllables, roughly: vowel groups, less a silent final e.
const syllables = (w: string) => {
  const s = w.toLowerCase().replace(/[^a-z]/g, "").replace(/(?<=..)e$/, "");
  return Math.max(1, s.match(/[aeiouy]+/g)?.length ?? 0);
};

function paragraphIssues(p: string) {
  const issues: string[] = [];
  if (!/([.!?…:;]["'”’»)\]]*|\p{Extended_Pictographic})$/u.test(p)) issues.push("No punctuation at the end");
  if (/(^[^\p{L}\d]*|(?<!\b(e\.g|i\.e|etc|vs))[.!?]\s+)\p{Ll}/u.test(p)) {
    issues.push("A sentence starts with a lowercase letter");
  }
  if (/(^|\s)i(\s|['’]|$)/.test(p)) issues.push("Lowercase “i”");
  const repeat = p.match(/(?<!\p{L})(\p{L}+)\s+\1(?!\p{L})/iu);
  if (repeat) issues.push(`Repeated word: “${repeat[0]}”`);
  if (/\S {2,}\S/.test(p)) issues.push("Double space");
  if (/\p{L} +([,;](?!\))|[.!?](?=\s|$))/u.test(p)) issues.push("Space before punctuation");
  if (/\p{L},\p{L}|\p{Ll}[.!?]\p{Lu}\p{Ll}/u.test(p)) issues.push("Missing space after punctuation");
  const longest = Math.max(...p.split(/(?<=[.!?…])\s+/).map((s) => words(s).length));
  if (longest > LONG_SENTENCE) issues.push(`A ${longest}-word sentence; try splitting it`);
  const count = words(p).length;
  if (count > LONG_PARAGRAPH) issues.push(`Long paragraph (${count} words)`);
  return issues;
}

export function checkWriting(title: string, markdown: string): WritingCheck {
  const paragraphs: string[] = [];
  const prose: string[] = [];
  let headings = 0;

  // Paragraphs get checked; list items and headings only count toward length.
  const walk = (tokens: Token[], check: boolean) => {
    for (const t of tokens) {
      if (t.type === "paragraph") {
        const text = plain(t.tokens).trim();
        prose.push(text);
        if (check && text) paragraphs.push(text);
      } else if (t.type === "heading") {
        headings++;
        prose.push(plain(t.tokens));
      } else if (t.type === "blockquote") walk(t.tokens ?? [], check);
      else if (t.type === "list") for (const item of t.items) walk(item.tokens, false);
      else if (t.type === "text") prose.push(plain(t.tokens ?? [t]));
    }
  };
  walk(lexer(markdown), true);

  const all = words(prose.join(" "));
  const sentences = Math.max(1, prose.join(" ").split(/[.!?…]+(\s|$)/).filter((s) => words(s ?? "").length).length);
  const article: WritingCheck["article"] = [];

  const t = title.trim();
  if (!t) article.push({ ok: false, text: "No title yet" });
  else if (t.length > SEARCH_TITLE) {
    article.push({ ok: false, text: `Title is ${t.length} characters; search results cut it around ${SEARCH_TITLE}` });
  } else article.push({ ok: true, text: `Title fits search results (${t.length} characters)` });

  const minutes = Math.max(1, Math.round(all.length / WPM));
  article.push(
    all.length < THIN
      ? { ok: false, text: `${all.length} words; under ${THIN} tends to rank poorly` }
      : { ok: true, text: `${all.length} words, ${minutes} min read` },
  );

  if (all.length >= THIN) {
    article.push(
      headings
        ? { ok: true, text: `${headings} heading${headings === 1 ? "" : "s"} to scan by` }
        : { ok: false, text: "No headings; add some so readers and search can scan it" },
    );
  }

  if (all.length) {
    // Flesch reading ease, for English: 60+ reads easily, under 30 is hard going.
    const ease = Math.round(
      206.835 - 1.015 * (all.length / sentences) - 84.6 * (all.reduce((n, w) => n + syllables(w), 0) / all.length),
    );
    const label = ease >= 60 ? "easy to read" : ease >= 30 ? "fairly hard to read" : "hard to read";
    article.push({ ok: ease >= 30, text: `Readability ${ease}: ${label}` });
  }

  return {
    article,
    paragraphs: paragraphs.map((p) => ({
      start: words(p).slice(0, 8).join(" ") + (words(p).length > 8 ? "…" : ""),
      issues: paragraphIssues(p),
    })),
  };
}
