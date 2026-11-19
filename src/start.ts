import { trackAgents } from "@databuddy/sdk/agents";
import { createMiddleware, createStart } from "@tanstack/react-start";
import { waitUntil } from "cloudflare:workers";
import { DATABUDDY_CLIENT_ID } from "@/lib/analytics";

// AI agents and crawlers (GPTBot, ClaudeBot, …) never run the page's script, so
// every request is reported here on the server. It isn't awaited: waitUntil keeps
// the Worker alive to send it without delaying the response. Browsers are ignored
// by trackAgents without any network call.
const aiAgents = createMiddleware({ type: "request" }).server(({ request, next }) => {
  waitUntil(trackAgents(request, { websiteId: DATABUDDY_CLIENT_ID }));
  return next();
});

export const startInstance = createStart(() => ({ requestMiddleware: [aiAgents] }));
