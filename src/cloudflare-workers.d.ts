// The Workers runtime APIs we use. Run `wrangler types` for the full set if more are needed.
declare module "cloudflare:workers" {
  export function waitUntil(promise: Promise<unknown>): void;
  export const env: {
    AI: { run(model: string, input: { audio: string }): Promise<{ text?: string }> };
  };
}
