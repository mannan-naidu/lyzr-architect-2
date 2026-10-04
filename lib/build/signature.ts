import { createHash } from "node:crypto";

/**
 * Normalise an error so the "same" failure is recognised across runs, sessions and projects:
 * drop line/column numbers, quoted identifiers, paths and hashes, keep the shape of the message.
 */
export function normalizeError(message: string): string {
  return message
    .split("\n")[0]
    .toLowerCase()
    .replace(/(["'`]).*?\1/g, "…") // quoted names / values
    .replace(/\(?\/?[\w.-]+\/[\w./-]+(:\d+)*(:\d+)?\)?/g, "<path>") // file paths with positions
    .replace(/\b\d+\b/g, "#") // numbers
    .replace(/[0-9a-f]{8,}/g, "<hex>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/** Stable fingerprint used as `fix_attempts.error_signature`. */
export function errorSignature(message: string): string {
  return createHash("sha256").update(normalizeError(message)).digest("hex").slice(0, 16);
}
