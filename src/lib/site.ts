// Social crawlers need absolute URLs. The public origin (same as wrangler.jsonc's
// route); VITE_SITE_URL overrides it, e.g. for a different host.
export const SITE_URL: string = import.meta.env.VITE_SITE_URL ?? "https://drafts.saranatour.dev";
export const REPO_URL = "https://github.com/saranatour1/article-drafting-tool";
