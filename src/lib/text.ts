// Rough plain text from markdown, for card excerpts and word counts; not for output.
export function plainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const wordCount = (markdown: string) => plainText(markdown).split(" ").filter(Boolean).length;

export function excerpt(markdown: string, length = 140) {
  const text = plainText(markdown);
  return text.length > length ? `${text.slice(0, length).replace(/\s+\S*$/, "")}…` : text;
}

const steps: [Intl.RelativeTimeFormatUnit, number][] = [
  ["minute", 60],
  ["hour", 60],
  ["day", 24],
  ["week", 7],
  ["month", 4.35],
  ["year", 12],
];

/** "20 minutes ago", "yesterday". Differs between server and browser clocks, so render it with suppressHydrationWarning. */
export function ago(at: number, now = Date.now()) {
  let value = (at - now) / 60_000;
  if (value > -1) return "just now";
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (let i = 0; i < steps.length; i++) {
    const next = steps[i + 1];
    if (!next || Math.abs(value) < next[1]) return format.format(Math.round(value), steps[i][0]);
    value /= next[1];
  }
  return "";
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";
