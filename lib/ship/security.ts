import type { WorkspaceFile } from "@/lib/build/types";

/**
 * Pre-deploy security check over the generated app. Deterministic pattern checks, run in the
 * browser before deploy and again on the server when the deployment is recorded.
 */
export type SecurityFinding = { severity: "high" | "medium" | "low"; title: string; file: string; fix: string };

const SECRET_PATTERNS: { re: RegExp; name: string }[] = [
  { re: /sk-ant-[A-Za-z0-9_-]{10,}/, name: "Anthropic API key" },
  { re: /sk-(proj-)?[A-Za-z0-9]{20,}/, name: "OpenAI API key" },
  { re: /gsk_[A-Za-z0-9]{20,}/, name: "Groq API key" },
  { re: /AIza[0-9A-Za-z_-]{30,}/, name: "Google API key" },
  { re: /gh[pousr]_[A-Za-z0-9]{30,}/, name: "GitHub token" },
  { re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, name: "JWT (possibly a service-role key)" },
  { re: /(api[_-]?key|secret|password)\s*[:=]\s*["'][^"'\s]{8,}["']/i, name: "Hard-coded secret" },
];

export function securityScan(files: WorkspaceFile[]): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  for (const f of files) {
    for (const { re, name } of SECRET_PATTERNS) {
      if (re.test(f.content)) {
        findings.push({ severity: "high", title: `${name} in client code`, file: f.path, fix: "Move it to a server-side environment variable." });
      }
    }
    if (/dangerouslySetInnerHTML/.test(f.content)) {
      findings.push({ severity: "medium", title: "Raw HTML injection", file: f.path, fix: "Sanitise the HTML or render it as text." });
    }
    if (/\beval\(|new Function\(/.test(f.content)) {
      findings.push({ severity: "medium", title: "Dynamic code execution", file: f.path, fix: "Remove eval / new Function." });
    }
    if (/http:\/\/(?!localhost)/.test(f.content)) {
      findings.push({ severity: "low", title: "Insecure http:// URL", file: f.path, fix: "Use https://." });
    }
    if (/localStorage\.setItem\([^)]*(token|password)/i.test(f.content)) {
      findings.push({ severity: "medium", title: "Credential stored in localStorage", file: f.path, fix: "Use an httpOnly cookie." });
    }
  }
  return findings;
}
