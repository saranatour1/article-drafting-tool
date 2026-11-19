/// <reference types="vite/client" />
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";

// Social crawlers need absolute URLs. The public origin (same as wrangler.jsonc's
// route); VITE_SITE_URL overrides it, e.g. for a different host.
const siteUrl: string = import.meta.env.VITE_SITE_URL ?? "https://drafts.saranatour.dev";
const title = "Article drafts";
const description =
  "Write an article once, preview how it looks on dev.to, X Articles and Medium, and copy it for each.";
const ogImage = `${siteUrl}/og.png`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title },
      { name: "description", content: description },
      { name: "theme-color", content: "#171717" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: title },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: siteUrl },
      { property: "og:image", content: ogImage },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Write once. Preview and copy it for dev.to, X Articles and Medium." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
