import { createFileRoute } from "@tanstack/react-router";
import { loadSession } from "@/lib/auth.server";
import { httpUrl, readMeta } from "@/lib/link-preview";

const MAX_CHARS = 512 * 1024; // the tags sit in <head>; never read a whole page

/**
 * A link's title, image and description for its card in the previews. The
 * browser can't read another site's HTML, so the server fetches it.
 */
export const Route = createFileRoute("/unfurl")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await loadSession()).token) return new Response("Sign in to preview links", { status: 401 });
        const url = httpUrl(new URL(request.url).searchParams.get("url") ?? "");
        if (!url) return new Response("Not a web link", { status: 400 });
        const page = await fetch(url, {
          headers: { "user-agent": "Mozilla/5.0 (compatible; LinkPreview/1.0)", accept: "text/html" },
          signal: AbortSignal.timeout(8000),
        }).catch(() => null);
        if (!page?.ok || !page.body || !page.headers.get("content-type")?.includes("html")) {
          await page?.body?.cancel();
          return Response.json(null);
        }
        const reader = page.body.pipeThrough(new TextDecoderStream()).getReader();
        let html = "";
        while (html.length < MAX_CHARS && !html.includes("</head>")) {
          const { done, value } = await reader.read();
          if (done) break;
          html += value;
        }
        await reader.cancel();
        return Response.json(readMeta(html, page.url || url), {
          headers: { "cache-control": "private, max-age=86400" },
        });
      },
    },
  },
});
