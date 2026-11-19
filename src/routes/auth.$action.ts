import { createFileRoute } from "@tanstack/react-router";
import { authHandlers } from "@/lib/auth.server";

const handlers = {
  signin: authHandlers.convexProxyHandler,
  refresh: authHandlers.refreshHandler,
  signout: authHandlers.signOutHandler,
};

export const Route = createFileRoute("/auth/$action")({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        Object.hasOwn(handlers, params.action)
          ? handlers[params.action as keyof typeof handlers](request)
          : new Response("Not found", { status: 404 }),
    },
  },
});
