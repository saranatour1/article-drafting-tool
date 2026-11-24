import { Marked } from "marked";

export type Platform = {
  id: string;
  label: string;
  /** Letters on the platform's tile; not its logo. */
  mark: string;
  /** Where it sits in the destinations dialog. */
  group: "words" | "blog" | "social" | "own";
  /** One line in the destinations dialog. */
  summary: string;
  /** Map an editor heading level to the level this platform actually supports. */
  heading: (depth: number) => number;
  /** Prepended to the copied markdown only (not shown in the preview). */
  frontMatter?: (title: string, tags: string[], options: RenderOptions) => string;
  /** The tags this platform would accept from the draft's; leave out if it has none. */
  tags?: (tags: string[]) => string[];
  /** One line on how to paste it. */
  tip: string;
  /** The site has a dark reading theme, so the preview offers a light/dark switch. */
  dark?: boolean;
  /** Byline next to the author, e.g. dev.to's "Posted on Nov 19". */
  byline?: (date: string) => string;
  /** The tools this site's own editor offers; the editor switches to them with the tab. */
  editor?: EditorSpec;
};

export type RenderOptions = {
  /** dev.to: import as an unpublished draft. */
  devtoDraft?: boolean;
};

/** A formatting control. `heading` is dev.to's H button; `style` is a Normal/Heading/Subheading menu. */
export type ToolId =
  | "style"
  | "heading"
  | "bold"
  | "italic"
  | "strike"
  | "link"
  | "code"
  | "codeBlock"
  | "orderedList"
  | "bulletList"
  | "quote"
  | "divider"
  | "image";

export type EditorSpec = {
  /** The toolbar, in the site's own order. */
  tools: ToolId[];
  /** Extra tools in the ⋮ menu (Undo and Redo are always there). */
  more?: ToolId[];
  /** Shows the tag field, with this limit. */
  maxTags?: number;
  /** X's name for plain text in the Style menu; its button then shows the current style, like "Body ▾". */
  bodyStyle?: string;
};

// Until a site's own editor has been matched, it gets these tools and no tag field.
export const DEFAULT_EDITOR: EditorSpec = {
  tools: ["bold", "italic", "link", "orderedList", "bulletList", "heading", "quote", "code", "codeBlock", "image"],
  more: ["strike", "divider"],
};

export const editorFor = (platform: Platform) => platform.editor ?? DEFAULT_EDITOR;

const twoSizes = (d: number) => (d <= 2 ? 2 : 3);
const dated = (date: string) => date;

// Lowercase letters and digits only ("Web Dev" becomes "webdev"), deduped.
const slugTags = (tags: string[]) => [
  ...new Set(tags.map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean)),
];
// As typed, deduped regardless of case.
const plainTags = (tags: string[]) =>
  tags.map((t) => t.trim()).filter((t, i, all) => t && all.findIndex((u) => u.toLowerCase() === t.toLowerCase()) === i);

/** Always on: no site rules, for pasting anywhere. */
export const PLAIN: Platform = {
  id: "plain",
  label: "Plain page",
  mark: "Aa",
  group: "words",
  summary: "No site rules. Copy it into Docs, Notion, an email or anything that takes paste.",
  heading: (d) => d,
  tip: "Paste it into Google Docs, Notion, an email or your own site. Headings, lists and links come along. Labels stay here.",
  byline: dated,
};

// Add a platform by adding an entry here and a `.preview-<id>` block in styles.css.
export const PLATFORMS: Platform[] = [
  PLAIN,
  {
    id: "devto",
    label: "dev.to",
    mark: "DEV",
    group: "blog",
    summary: "Front matter, up to 4 tags",
    heading: (d) => Math.max(2, d), // the title is the page's only h1
    frontMatter: (title, tags, { devtoDraft = true }) =>
      `---\ntitle: ${JSON.stringify(title || "Untitled")}\npublished: ${!devtoDraft}\ntags: ${tags.join(", ")}\n---\n\n`,
    // dev.to: at most 4, lowercase letters and digits only.
    tags: (tags) => slugTags(tags).slice(0, 4),
    tip: "Paste into dev.to's editor. It reads the markdown, and the front matter sets the title.",
    dark: true,
    byline: (date) => `Posted on ${date}`,
    editor: { ...DEFAULT_EDITOR, maxTags: 4 },
  },
  {
    id: "hashnode",
    label: "Hashnode",
    mark: "H",
    group: "blog",
    summary: "Markdown with tags",
    heading: (d) => Math.max(2, d),
    tags: (tags) => plainTags(tags).slice(0, 5),
    tip: "Paste into Hashnode's editor; it reads the markdown. Add the tags in its tag field.",
    byline: dated,
    editor: { ...DEFAULT_EDITOR, maxTags: 5 },
  },
  {
    id: "medium",
    label: "Medium",
    mark: "M",
    group: "blog",
    summary: "Rich text paste, two heading sizes",
    heading: twoSizes, // Medium has a big and a small heading
    tip: "Paste into a new Medium story; it reads the rich text. Type the title first.",
  },
  {
    id: "substack",
    label: "Substack",
    mark: "S",
    group: "blog",
    summary: "Rich text paste into a post",
    heading: twoSizes,
    tip: "Paste into a new Substack post; it reads the rich text. The title has its own field.",
  },
  {
    id: "ghost",
    label: "Ghost",
    mark: "G",
    group: "blog",
    summary: "Markdown card or rich text",
    heading: twoSizes,
    tip: "Paste into the Ghost editor as rich text, or into a Markdown card.",
    byline: dated,
  },
  {
    id: "wordpress",
    label: "WordPress",
    mark: "W",
    group: "blog",
    summary: "Paste into the block editor",
    heading: (d) => Math.max(2, d),
    tip: "Paste into the block editor; headings, lists and quotes become blocks. The title has its own field.",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    mark: "in",
    group: "social",
    summary: "Article editor, two heading sizes",
    heading: twoSizes, // its Style menu offers two heading sizes
    tip: "Paste into a LinkedIn article (Write article); it reads the rich text. Title and cover image have their own fields.",
    // LinkedIn's article toolbar, in its order (its embed button has no markdown equivalent).
    editor: {
      tools: ["style", "bold", "italic", "bulletList", "orderedList", "quote", "codeBlock", "divider", "link", "image"],
    },
  },
  {
    id: "x",
    label: "X Articles",
    mark: "X",
    group: "social",
    summary: "Heading and subheading",
    heading: (d) => (d <= 2 ? 1 : 2), // X's editor keeps Heading as h1 and Subheading as h2
    tip: "Paste into the X article body; it reads the rich text. Type the title into its own field. Images may need re-uploading.",
    dark: true,
    byline: dated,
    // X's article toolbar, in its order; Divider and Code block sit in its Insert menu.
    editor: {
      tools: ["bold", "italic", "strike", "style", "quote", "bulletList", "orderedList", "link", "image"],
      more: ["divider", "codeBlock"],
      bodyStyle: "Body",
    },
  },
];

/** A site the user set up in Settings, as saved by convex/sites.ts. */
export type Site = {
  clientId: string;
  name: string;
  headingTop: number;
  headingSub: number;
  maxTags: number;
  lowercaseTags: boolean;
  frontMatter: string;
  tip: string;
};

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

/** Fills {title}, {tags} and {date}; the title is quoted so a colon in it can't break YAML. */
export function fillFrontMatter(template: string, title: string, tags: string[], date = today()) {
  const fields: Record<string, string> = { title: JSON.stringify(title || "Untitled"), tags: tags.join(", "), date };
  return template.replace(/\{(title|tags|date)\}/g, (_, key: string) => fields[key]);
}

export function sitePlatform(site: Site): Platform {
  const takesTags = site.maxTags > 0;
  return {
    id: site.clientId,
    label: site.name,
    mark: site.name.trim().charAt(0).toUpperCase() || "?",
    group: "own",
    summary: [site.frontMatter.trim() && "Front matter", takesTags && `up to ${site.maxTags} tags`]
      .filter(Boolean)
      .join(", ") || "Your rules",
    heading: (d) => (d <= 2 ? site.headingTop : site.headingSub),
    frontMatter: site.frontMatter.trim()
      ? (title, tags) => `${fillFrontMatter(site.frontMatter.trim(), title, tags)}\n\n`
      : undefined,
    tags: takesTags ? (tags) => (site.lowercaseTags ? slugTags(tags) : plainTags(tags)).slice(0, site.maxTags) : undefined,
    tip: site.tip || `Copy it for ${site.name}.`,
    byline: dated,
    editor: takesTags ? { ...DEFAULT_EDITOR, maxTags: site.maxTags } : undefined,
  };
}

/** The preview tabs for a draft: the plain page, then its destinations that still exist. */
export function destinationsFor(ids: string[], sites: Site[]) {
  const all = [...PLATFORMS, ...sites.map(sitePlatform)];
  return [PLAIN, ...ids.flatMap((id) => all.filter((p) => p.id === id && p.id !== PLAIN.id))];
}

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
  options: RenderOptions = {},
) {
  const body = platformBody(platform, markdown);
  const tags = platform.tags?.(draftTags) ?? [];
  return {
    markdown: (platform.frontMatter?.(title, tags, options) ?? "") + body,
    html: marked.parse(body, { async: false }),
    tags,
  };
}
