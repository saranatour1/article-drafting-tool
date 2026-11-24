import { getAuthUserId } from "@convex-dev/auth/server";
import { normalizeGithubProfile } from "@convex-dev/auth/methods/github/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { decryptTicketPayload, sha256Hex } from "./ticket";

/**
 * Connect a GitHub account to the signed-in user, so either way of signing in
 * opens the same drafts. It redeems the one-time code from GitHub's redirect the
 * way completeSignInWithGithub does, but links the account instead of signing in.
 * The flow is started and finished by src/routes/link-github.ts.
 */
export const linkGithub = mutation({
  args: { code: v.string(), state: v.string() },
  returns: v.union(v.literal("linked"), v.literal("expired"), v.literal("taken")),
  handler: async (ctx, { code, state }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const ticket = await ctx.runMutation(components.authGithub.provider.claimTicket, {
      ticketCodeHash: await sha256Hex(code),
      stateHash: await sha256Hex(state),
    });
    if (ticket === null) return "expired";
    const payload = JSON.parse(await decryptTicketPayload(code, ticket.encryptedPayload));
    const profile = normalizeGithubProfile(payload.userInfoResponses);
    const owner = await ctx.runQuery(components.authGithub.provider.getUserIdByAccount, { providerAccountId: profile.id });
    if (owner !== null && owner !== userId) return "taken"; // it already signs in to another account here
    if (owner === null) {
      await ctx.runMutation(components.authGithub.provider._internal_dangerous_createAccount, {
        providerAccountId: profile.id,
        userId,
      });
    }
    await ctx.db.patch("users", userId, { name: profile.login });
    return "linked";
  },
});
