import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { loadSession } from "@/lib/auth.server";

const MAX_BYTES = 10 * 1024 * 1024; // a few minutes of opus; Whisper's own limit is higher

/**
 * Speech to text for browsers whose built-in recognition can't reach a speech
 * service (Brave, Arc, Firefox). The mic records a clip and posts it here.
 */
export const Route = createFileRoute("/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await loadSession()).token) return new Response("Sign in to dictate", { status: 401 });
        const audio = await request.arrayBuffer();
        if (audio.byteLength === 0) return Response.json({ text: "" });
        if (audio.byteLength > MAX_BYTES) return new Response("Recording too long", { status: 413 });
        const { text } = await env.AI.run("@cf/openai/whisper-large-v3-turbo", {
          audio: Buffer.from(audio).toString("base64"),
        });
        return Response.json({ text: text ?? "" });
      },
    },
  },
});
