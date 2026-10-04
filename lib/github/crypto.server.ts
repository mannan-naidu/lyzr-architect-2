import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * AES-256-GCM for the user's GitHub token at rest (github_connections.token_ciphertext).
 * Key: GITHUB_TOKEN_KEY (32 bytes, base64), or, if unset, a key derived from the service-role
 * key so a fresh deploy works; set GITHUB_TOKEN_KEY explicitly in production.
 */
function key(): Buffer {
  const explicit = process.env.GITHUB_TOKEN_KEY?.trim();
  if (explicit) {
    const k = Buffer.from(explicit, "base64");
    if (k.length !== 32) throw new Error("GITHUB_TOKEN_KEY must be 32 bytes, base64-encoded");
    return k;
  }
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("Set GITHUB_TOKEN_KEY (or SUPABASE_SERVICE_ROLE_KEY) to store GitHub tokens");
  return createHash("sha256").update(`architect:github-token:${base}`).digest();
}

export function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

export function decryptToken(payload: string): string {
  const [version, iv, tag, data] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unrecognised token format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
