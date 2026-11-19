import { createRequire } from "node:module";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Convex Auth 2.0 ships its cookie-based SSR client provider only under the
// Next.js adapter and doesn't export it. The file itself is framework-agnostic
// (convex + react only), so we alias straight to it. Resolved through the real
// path so it shares module instances with `@convex-dev/auth/react`.
// shortcut: depends on @convex-dev/auth's dist layout (pinned 2.0.0); drop when
// Convex Auth ships a TanStack Start adapter.
const convexAuthReact = createRequire(import.meta.url).resolve(
  "@convex-dev/auth/react",
);
const convexAuthSsrClient = path.join(
  path.dirname(convexAuthReact),
  "../ssr/nextjs/client.js",
);

export default defineConfig({
  server: { port: 3000 },
  resolve: {
    tsconfigPaths: true,
    alias: { "convex-auth-ssr-client": convexAuthSsrClient },
  },
  // Keep the aliased file and the package's own entry points in one SSR module
  // graph, or the server renders with two copies of the auth React context.
  ssr: { noExternal: ["@convex-dev/auth"] },
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
});
