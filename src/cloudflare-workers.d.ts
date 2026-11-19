// The one Workers runtime API we use. Run `wrangler types` for the full set if more are needed.
declare module "cloudflare:workers" {
  export function waitUntil(promise: Promise<unknown>): void;
}
