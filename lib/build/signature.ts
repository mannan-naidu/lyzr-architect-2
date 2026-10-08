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

/**
 * Where the error happens: the first source file it names plus the offending code line from the
 * bundler's code frame (the line marked ">"). Two errors with the same message in different
 * places are usually different problems, so fix memory treats them as weaker matches.
 * Returns "" when the error names no file (then only the message signature is available).
 */
export function errorLocation(message: string): string {
  const file = message.match(/\/[\w.-]+(?:\/[\w.-]+)*\.(?:tsx?|jsx?|css)/)?.[0] ?? "";
  const line =
    message
      .split("\n")
      .find((l) => /^\s*>\s*\d+\s*\|/.test(l))
      ?.replace(/^\s*>\s*\d+\s*\|/, "")
      .replace(/\s+/g, " ")
      .trim() ?? "";
  return file || line ? `${file}|${line}`.slice(0, 300) : "";
}
