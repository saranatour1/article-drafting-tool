# Article drafting tool

Write an article once, preview how it formats on dev.to, X Articles and Medium, and copy it for each.

**Stack:** TanStack Start (SSR) · Convex + Convex Auth 2.0 (username/password) · TanStack DB with `@tanstack/convex-db-collection` (local-first writes) · TipTap 3 · Tailwind 4 · shadcn/ui

## Run

```bash
pnpm install
pnpm dev        # local Convex backend on :3210 + app on http://localhost:3000
```

The Convex backend is a local, account-less deployment (`.env.local`). To move it to your Convex account: `pnpm convex login`, then `pnpm convex dev --configure`.


## GitHub sign-in

1. Create a GitHub OAuth App (GitHub → Settings → Developer settings → OAuth Apps → New OAuth App):
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `<CONVEX_SITE_URL>/oauth/github/callback`, for this deployment `https://diligent-lark-191.eu-west-1.convex.site/oauth/github/callback`
2. Put its client ID and a new client secret on the deployment, in the dashboard's environment variables or with:
   ```bash
   pnpm convex env set AUTH_GITHUB_CLIENT_ID <client id>
   pnpm convex env set AUTH_GITHUB_CLIENT_SECRET <client secret>
   ```
   Convex refuses to deploy until both are set.
3. When the app is served somewhere other than `http://localhost:3000`, set `APP_ORIGINS` (comma-separated) so GitHub may redirect back there.

## Logo and link previews

- Logo/favicon: `public/logo.svg`. Open Graph + Twitter card tags live in `src/routes/__root.tsx`.
- Link-preview image: `public/og.png`, rendered from `scripts/og.html` with `pnpm og` (headless Chrome).
- Link previews use `https://drafts.saranatour.dev` (default in `src/routes/__root.tsx`); set `VITE_SITE_URL` in the build environment to override it. No env file is committed: `.env*` is git-ignored.

## How it fits together

- **SSR:** `src/routes/index.tsx` loads the session and drafts on the server (`src/lib/auth.server.ts`) from httpOnly auth cookies, so the first HTML already has your drafts and previews.
- **Local-first:** `src/lib/drafts.ts`. Drafts live in a TanStack DB collection mirrored from `convex/drafts.ts`. Edits apply locally right away, then go through a durable IndexedDB outbox that replays to Convex after a reload or reconnect.
- **Editor:** `src/components/editor.tsx` (TipTap + markdown); type `/` for blocks (`slash-command.tsx`).
- **Platforms:** `src/lib/platforms.ts`. To add one, add an entry there and a `.preview-<id>` block in `src/styles.css`. "Copy markdown" puts markdown (for dev.to) and HTML (for Medium and X, which read rich text on paste) on the clipboard together.
- **Link cards:** a bare link on its own line shows in the previews as the card X, Medium and Substack would embed. `src/routes/unfurl.ts` fetches the page's Open Graph tags (signed-in only) and `src/lib/link-preview.ts` reads them; copies keep the plain link so each site builds its own embed.

## Checks

```bash
pnpm typecheck && pnpm test && pnpm build
```
