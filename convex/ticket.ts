// Mirrors @convex-dev/auth 2.0.0's lib/crypto.js and lib/oauth/crypto.js, which
// the package doesn't export. shortcut: re-check these when upgrading it.

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function decryptTicketPayload(ticketCode: string, encrypted: string) {
  const keyBytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`convex-auth-ticket-payload:${ticketCode}`),
  );
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const base64 = encrypted.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encrypted.length / 4) * 4, "=");
  const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: combined.slice(0, 12) }, key, combined.slice(12));
  return new TextDecoder().decode(plaintext);
}
