/** What a page says about itself in its Open Graph / Twitter tags: what X, Medium and Substack build a link card from. */
export type LinkPreview = { title: string; description?: string; image?: string; site: string };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s: string) =>
  s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] !== "#") return ENTITIES[e.toLowerCase()] ?? m;
    const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1));
    return code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** An absolute http(s) URL, or undefined: keeps javascript: and data: links out of fetches and cards. */
export function httpUrl(raw: string, base?: string) {
  try {
    const url = new URL(raw, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** The card for a page, from its HTML; null when it has no title to show. */
export function readMeta(html: string, pageUrl: string): LinkPreview | null {
  const meta: Record<string, string> = {};
  for (const [tag] of html.matchAll(/<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const [, key, dq, sq] of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[key.toLowerCase()] = dq ?? sq;
    const name = (attrs.property ?? attrs.name)?.toLowerCase();
    if (name && attrs.content && !(name in meta)) meta[name] = decode(attrs.content).trim();
  }
  const title = meta["og:title"] || meta["twitter:title"] || decode(/<title[^>]*>([^<]*)/i.exec(html)?.[1] ?? "").trim();
  if (!title) return null;
  const image = meta["og:image"] || meta["twitter:image"] || meta["twitter:image:src"];
  return {
    title,
    description: meta["og:description"] || meta["twitter:description"] || meta.description || undefined,
    image: image ? httpUrl(image, pageUrl) : undefined,
    site: meta["og:site_name"] || new URL(pageUrl).hostname.replace(/^www\./, ""),
  };
}

// A paragraph that is only a bare URL (link text = href), as marked renders it. Sites embed those.
const LONE_LINK = /<p><a href="([^"]+)">\1<\/a><\/p>/g;

/** The web links that sit alone on their own line in rendered HTML. */
export const loneLinks = (html: string) => [
  ...new Set([...html.matchAll(LONE_LINK)].flatMap(([, href]) => httpUrl(decode(href)) ?? [])),
];

/** Swaps each lone link that has a preview for its card. */
export function withCards(html: string, previews: ReadonlyMap<string, LinkPreview | null>) {
  return html.replace(LONE_LINK, (p, href: string) => {
    const url = httpUrl(decode(href));
    const card = url && previews.get(url);
    if (!card) return p;
    const image = card.image ? `<img src="${esc(card.image)}" alt="" loading="lazy">` : "";
    const description = card.description ? `<span>${esc(card.description)}</span>` : "";
    return (
      `<a class="link-card not-prose" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${image}` +
      `<span><small>${esc(card.site)}</small><strong>${esc(card.title)}</strong>${description}</span></a>`
    );
  });
}
