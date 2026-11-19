import { trackAgents } from "@databuddy/sdk/agents";
import { createMiddleware, createStart } from "@tanstack/react-start";
import { DATABUDDY_CLIENT_ID } from "@/lib/analytics";

// AI agents and crawlers (GPTBot, ClaudeBot, …) never run the page's script, so
// they're recorded here on the server. Browsers return immediately with no request.
// ponytail: awaited, so an agent's request waits on Databuddy (3s timeout); hand it
// to waitUntil from "cloudflare:workers" if that latency ever matters.
const aiAgents = createMiddleware({ type: "request" }).server(async ({ request, next }) => {
  await trackAgents(request, { websiteId: DATABUDDY_CLIENT_ID });
  return next();
});

export const startInstance = createStart(() => ({ requestMiddleware: [aiAgents] }));
