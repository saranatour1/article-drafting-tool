/// <reference types="vite/client" />
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { DatabuddyProvider } from "@databuddy/sdk/react";
import type { ReactNode } from "react";
import { DATABUDDY_CLIENT_ID } from "@/lib/analytics";
import { SITE_URL } from "@/lib/site";
import appCss from "../styles.css?url";

const siteUrl = SITE_URL;

// Before first paint: the theme saved in Preferences (copied to localStorage), so dark pages don't flash light.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;
const title = "Article drafts";
const description =
  "Draft articles out loud or by hand, then preview and copy them for dev.to, Medium, LinkedIn, X and more.";
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
    // The theme script changes the class before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant, no user input */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        {/* Replay masks text by default, so draft contents stay out of recordings. */}
        <DatabuddyProvider
          clientId={DATABUDDY_CLIENT_ID}
          autocapture={{ webVitals: true, errors: true }}
          replay
        />
        <Scripts />
      </body>
    </html>
  );
}
