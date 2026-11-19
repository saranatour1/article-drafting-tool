import { Marked } from "marked";

export type Platform = {
  id: string;
  label: string;
  /** Map an editor heading level to the level this platform actually supports. */
  heading: (depth: number) => number;
  /** Prepended to the copied markdown only (not shown in the preview). */
  frontMatter?: (title: string, tags: string[]) => string;
  /** The tags this platform would accept from the draft's; leave out if it has none. */
  tags?: (tags: string[]) => string[];
  /** One line on how to paste it. */
  tip: string;
  /** The site has a dark reading theme, so the preview offers a light/dark switch. */
  dark?: boolean;
  /** Byline next to the author, e.g. dev.to's "Posted on Nov 19". */
  byline?: (date: string) => string;
};

// Add a platform by adding an entry here and a `.preview-<id>` block in styles.css.
export const PLATFORMS: Platform[] = [
  {
    id: "devto",
    label: "dev.to",
    heading: (d) => Math.max(2, d), // the title is the page's only h1
    frontMatter: (title, tags) =>
      `---\ntitle: ${JSON.stringify(title || "Untitled")}\npublished: false\ntags: ${tags.join(", ")}\n---\n\n`,
    // dev.to: at most 4, lowercase letters and digits only ("Web Dev" becomes "webdev").
    tags: (tags) =>
      [...new Set(tags.map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean))].slice(0, 4),
    tip: "Paste into dev.to's editor. It reads the markdown, and the front matter sets the title as a draft.",
    dark: true,
    byline: (date) => `Posted on ${date}`,
  },
  {
    id: "x",
    label: "X Articles",
    heading: (d) => (d <= 2 ? 2 : 3), // Heading and Subheading only
    tip: "Paste into the X article body; it reads the rich text. Type the title into its own field. Images may need re-uploading.",
  },
  {
    id: "medium",
    label: "Medium",
    heading: (d) => (d <= 2 ? 2 : 3), // Medium has a big and a small heading
    tip: "Paste into a new Medium story; it reads the rich text. Type the title first.",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    heading: (d) => (d <= 2 ? 2 : 3), // its Style menu offers two heading sizes
    tip: "Paste into a LinkedIn article (Write article); it reads the rich text. Title and cover image have their own fields.",
  },
];

// Escape raw HTML in the markdown: it may have been pasted in from the web.
const marked = new Marked({
  gfm: true,
  renderer: {
    html: ({ text }) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
  },
});

function platformBody(platform: Platform, markdown: string) {
  return marked
    .lexer(markdown)
    .map((t) =>
      t.type === "heading" ? t.raw.replace(/^#{1,6}/, "#".repeat(platform.heading(t.depth))) : t.raw,
    )
    .join("");
}

export function renderForPlatform(
  platform: Platform,
  title: string,
  markdown: string,
  draftTags: string[] = [],
) {
  const body = platformBody(platform, markdown);
  const tags = platform.tags?.(draftTags) ?? [];
  return {
    markdown: (platform.frontMatter?.(title, tags) ?? "") + body,
    html: marked.parse(body, { async: false }),
    tags,
  };
}
