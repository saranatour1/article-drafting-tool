// Run: node --test src/lib/ticket.test.ts
// convex/ticket.ts copies two helpers @convex-dev/auth doesn't export; this checks them against the originals.
import assert from "node:assert/strict";
import { test } from "node:test";
import { sha256Hex as theirHash } from "../../node_modules/@convex-dev/auth/dist/lib/crypto.js";
import { encryptTicketPayload } from "../../node_modules/@convex-dev/auth/dist/lib/oauth/crypto.js";
import { decryptTicketPayload, sha256Hex } from "../../convex/ticket.ts";

test("decrypts what the library encrypts, and hashes the same", async () => {
  const payload = JSON.stringify({ userInfoResponses: { user: { id: 1, login: "octocat" } } });
  assert.equal(await decryptTicketPayload("one-time-code", await encryptTicketPayload("one-time-code", payload)), payload);
  await assert.rejects(decryptTicketPayload("wrong-code", await encryptTicketPayload("one-time-code", payload)));
  assert.equal(await sha256Hex("state"), await theirHash("state"));
});
