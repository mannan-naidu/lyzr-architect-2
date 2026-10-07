// Feature search: an index of everything Architect can do, so a search like "cost" or "wordpress"
// points users straight at the right place. Client-safe.
//
// Prototype: weighted text matching over titles, synonyms and descriptions.
// Production (ARCHITECTURE.md §9): the same index plus help docs embedded and searched with the
// hybrid vector + BM25 pipeline we already run for memory, so "why is my bill high" finds the
// billing ledger even with no shared words. Zero-result queries are logged to find missing features.

export type WorkspaceTab = "plan" | "preview" | "code" | "memory" | "agents" | "content" | "ship" | "logs" | "trace";
export type MemoryView = "memories" | "decisions" | "fixes" | "ledger";

export type FeatureTarget =
  | { kind: "tab"; tab: WorkspaceTab; view?: MemoryView; pro?: boolean }
  | { kind: "element"; selector: string; label: string }
  | { kind: "route"; href: string }
  | { kind: "action"; action: "tour" | "theme" | "pro-mode" };

export type Feature = {
  id: string;
  title: string;
  summary: string;
  /** Synonyms and phrases people actually type. */
  keywords: string[];
  target: FeatureTarget;
  /** Where it lives, shown under the result ("Workspace → Memory → Billing ledger"). */
  where: string;
};

export const FEATURES: Feature[] = [
  // ── Memory (the differentiator) ────────────────────────────────────────────────────────────
  {
    id: "memory",
    title: "What Architect remembers",
    summary: "See, edit or delete the preferences and facts Architect has learned about how you build.",
    keywords: ["memory", "memories", "remember", "preferences", "forget", "privacy", "delete memory", "edit memory", "cognis", "personalise", "personalize"],
    target: { kind: "tab", tab: "memory", view: "memories" },
    where: "Workspace → Memory",
  },
  {
    id: "decisions",
    title: "Decision log",
    summary: "Settled project decisions, injected into every build so Architect never re-asks.",
    keywords: ["decisions", "decision log", "rules", "constraints", "context", "requirements"],
    target: { kind: "tab", tab: "memory", view: "decisions" },
    where: "Workspace → Memory → Decision log",
  },
  {
    id: "fixes",
    title: "Fix history & loop breaker",
    summary: "Every fix tried, what worked, and the 3-attempt loop breaker that rolls back and asks you.",
    keywords: ["fix history", "fixes", "attempts", "loop", "doom loop", "rollback", "undo", "stuck", "retry"],
    target: { kind: "tab", tab: "memory", view: "fixes" },
    where: "Workspace → Memory → Fix history",
  },
  {
    id: "ledger",
    title: "Billing ledger (fair billing)",
    summary: "Every model call with tokens and cost, split into what you paid and what Architect absorbed.",
    keywords: ["billing", "bill", "cost", "costs", "pay", "price", "pricing", "credits", "tokens", "usage", "spend", "money", "invoice", "charge", "free fixes"],
    target: { kind: "tab", tab: "memory", view: "ledger" },
    where: "Workspace → Memory → Billing ledger",
  },
  {
    id: "fix-it",
    title: "Fix it · free",
    summary: "When the preview breaks, one click fixes it, reusing fixes that worked before. Never billed to you.",
    keywords: ["fix", "error", "errors", "bug", "broken", "crash", "not working", "self heal", "repair", "debug"],
    target: { kind: "tab", tab: "preview" },
    where: "Workspace → Preview (appears on errors)",
  },
  // ── Build flow ─────────────────────────────────────────────────────────────────────────────
  {
    id: "plan",
    title: "Plan before building",
    summary: "Screens, agents and decisions drafted first; revise, then approve and build.",
    keywords: ["plan", "prd", "spec", "requirements", "screens", "user stories", "approve", "build", "start", "revise", "rebuild"],
    target: { kind: "tab", tab: "plan" },
    where: "Workspace → Plan",
  },
  {
    id: "preview",
    title: "Live preview",
    summary: "Your app running live, with desktop, tablet and phone sizes.",
    keywords: ["preview", "run", "see app", "view app", "mobile", "tablet", "phone", "responsive", "device"],
    target: { kind: "tab", tab: "preview" },
    where: "Workspace → Preview",
  },
  {
    id: "chat",
    title: "Chat with Architect",
    summary: "Ask questions or describe changes; send new prompts while others are still running.",
    keywords: ["chat", "ask", "prompt", "message", "talk", "parallel", "question"],
    target: { kind: "element", selector: '[data-tour="chat-input"] textarea', label: "chat box" },
    where: "Workspace → chat (left)",
  },
  {
    id: "model",
    title: "Choose the AI model",
    summary: "Switch between Claude, GPT, Gemini, Groq and OpenRouter models per message.",
    keywords: ["model", "models", "llm", "claude", "gpt", "openai", "gemini", "groq", "llama", "provider", "switch model", "byok"],
    target: { kind: "element", selector: '[data-tour="model-picker"]', label: "model picker" },
    where: "Workspace → top bar",
  },
  {
    id: "pro",
    title: "Pro mode",
    summary: "The developer lens: diffs, edit code by hand, logs and the agent trace. Same project.",
    keywords: ["pro", "pro mode", "developer", "advanced", "simple mode", "technical", "switch mode"],
    target: { kind: "action", action: "pro-mode" },
    where: "Workspace → top bar → Simple / Pro",
  },
  {
    id: "code",
    title: "Code and files",
    summary: "Browse every file Architect generated.",
    keywords: ["code", "files", "source", "file tree", "tsx", "react"],
    target: { kind: "tab", tab: "code" },
    where: "Workspace → Code",
  },
  {
    id: "diff",
    title: "Diffs: what changed",
    summary: "Line-by-line changes from the last build or fix.",
    keywords: ["diff", "diffs", "changes", "changed", "compare", "review", "what changed"],
    target: { kind: "tab", tab: "code", pro: true },
    where: "Workspace → Code (Pro)",
  },
  {
    id: "edit-code",
    title: "Edit code by hand",
    summary: "Change a file yourself; Architect builds on your edit.",
    keywords: ["edit code", "manual", "by hand", "change file", "write code"],
    target: { kind: "tab", tab: "code", pro: true },
    where: "Workspace → Code → Edit by hand (Pro)",
  },
  {
    id: "logs",
    title: "Logs",
    summary: "Terminal-style log of every plan, build, fix and deploy step.",
    keywords: ["logs", "log", "terminal", "console", "output", "events"],
    target: { kind: "tab", tab: "logs", pro: true },
    where: "Workspace → Logs (Pro)",
  },
  {
    id: "trace",
    title: "Agent trace",
    summary: "Each run as a timeline: steps, timings and tokens.",
    keywords: ["trace", "timeline", "steps", "observability", "debug", "latency", "runs"],
    target: { kind: "tab", tab: "trace", pro: true },
    where: "Workspace → Trace (Pro)",
  },
  // ── Agents ─────────────────────────────────────────────────────────────────────────────────
  {
    id: "agents",
    title: "Agents and agent graph",
    summary: "The AI agents behind your app, their tools and who hands off to whom.",
    keywords: ["agents", "agent", "graph", "handoff", "tools", "multi agent", "workflow", "orchestration"],
    target: { kind: "tab", tab: "agents" },
    where: "Workspace → Agents",
  },
  {
    id: "agent-memory",
    title: "Agent memory toggle",
    summary: "Let an agent remember each of your end users across sessions (Lyzr Cognis).",
    keywords: ["agent memory", "end user memory", "remember users", "cognis", "personalisation"],
    target: { kind: "tab", tab: "agents" },
    where: "Workspace → Agents → Memory switch",
  },
  {
    id: "frameworks",
    title: "Export agents to any framework",
    summary: "One spec compiled to Lyzr, LangGraph, CrewAI, OpenAI Agents SDK or TypeScript.",
    keywords: ["framework", "langgraph", "crewai", "openai agents", "agents sdk", "lyzr", "python", "typescript", "export", "sdk"],
    target: { kind: "tab", tab: "agents" },
    where: "Workspace → Agents → Compile to",
  },
  // ── Ship ───────────────────────────────────────────────────────────────────────────────────
  {
    id: "deploy",
    title: "Deploy",
    summary: "One click: security check, SEO files, build, and a live URL with an agents endpoint.",
    keywords: ["deploy", "publish", "launch", "host", "hosting", "go live", "url", "domain", "release"],
    target: { kind: "tab", tab: "ship" },
    where: "Workspace → Ship → Deploy",
  },
  {
    id: "github",
    title: "Push to GitHub",
    summary: "Create a repo and push the app, agents and SEO files in one commit.",
    keywords: ["github", "git", "repo", "repository", "push", "commit", "export code", "own code", "version control"],
    target: { kind: "tab", tab: "ship" },
    where: "Workspace → Ship → GitHub",
  },
  {
    id: "security",
    title: "Security pre-check",
    summary: "Scans for secrets in client code, injection and unsafe patterns before every deploy.",
    keywords: ["security", "secrets", "api key leak", "vulnerability", "safe", "scan", "audit"],
    target: { kind: "tab", tab: "ship" },
    where: "Workspace → Ship → Security pre-check",
  },
  {
    id: "seo",
    title: "SEO + GEO",
    summary: "Build static-first so Google and AI answer engines can read and quote your site; report in Ship.",
    keywords: ["seo", "geo", "google", "search ranking", "ranking", "llms.txt", "sitemap", "meta tags", "chatgpt", "perplexity", "found", "traffic"],
    target: { kind: "tab", tab: "plan" },
    where: "New project / Plan (switch) → Ship (report)",
  },
  {
    id: "cms",
    title: "Content mode (CMS) and WordPress import",
    summary: "Edit pages, posts and FAQs without code, or import them from a WordPress site.",
    keywords: ["cms", "content", "wordpress", "blog", "posts", "pages", "faq", "articles", "editor", "import"],
    target: { kind: "tab", tab: "ship" },
    where: "Workspace → Ship → Content mode",
  },
  // ── App-wide ───────────────────────────────────────────────────────────────────────────────
  {
    id: "new-project",
    title: "New project",
    summary: "Start a new app from a prompt.",
    keywords: ["new", "create", "start", "project", "app", "build new"],
    target: { kind: "route", href: "/dashboard?new=1" },
    where: "Dashboard",
  },
  {
    id: "tour",
    title: "Take the quick tour",
    summary: "A 7-step walkthrough of the workspace.",
    keywords: ["tour", "help", "guide", "onboarding", "how to", "tutorial", "getting started"],
    target: { kind: "action", action: "tour" },
    where: "Anywhere",
  },
  {
    id: "theme",
    title: "Light / dark theme",
    summary: "Switch between ink (dark) and paper (light).",
    keywords: ["theme", "dark mode", "light mode", "colors", "appearance"],
    target: { kind: "action", action: "theme" },
    where: "Header",
  },
];

const STOP_WORDS = new Set(
  "a an the is am are was were be to of in on at for and or my me i we you your it this that how what where why when do does did can could should would will much many some any with from by about please want need".split(" "),
);

/** Light stemming so "agents" ≈ "agent" and "paying" ≈ "pay". */
function stem(t: string): string {
  if (t.length > 5 && t.endsWith("ing")) return t.slice(0, -3);
  if (t.length > 4 && t.endsWith("ed")) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
  return t;
}

/** Lowercase, stemmed words. */
function tokens(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean).map(stem);
}

export type FeatureHit = { feature: Feature; score: number };

/**
 * Weighted text match: title > keyword phrase > keyword word > summary, with prefix matching
 * so partial typing works ("depl" → Deploy). Every query word must match somewhere.
 */
export function searchFeatures(query: string, limit = 8): FeatureHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = tokens(q);
  // Drop filler words ("how much am I paying" → "pay"), unless that leaves nothing.
  const meaningful = all.filter((t) => !STOP_WORDS.has(t));
  const qTokens = meaningful.length ? meaningful : all;
  if (!qTokens.length) return [];

  const hits: FeatureHit[] = [];
  for (const feature of FEATURES) {
    const title = tokens(feature.title);
    const keywordWords = feature.keywords.flatMap(tokens);
    const summary = tokens(feature.summary);
    let score = 0;
    let matched = 0;

    for (const t of qTokens) {
      const match = (words: string[]) => words.some((w) => w === t || (t.length >= 2 && w.startsWith(t)));
      const exact = (words: string[]) => words.includes(t);
      let s = 0;
      if (exact(title)) s = 6;
      else if (match(title)) s = 4;
      else if (exact(keywordWords)) s = 4;
      else if (match(keywordWords)) s = 3;
      else if (match(summary)) s = 1;
      if (s) matched += 1;
      score += s;
    }
    // Whole-phrase bonus ("dark mode", "doom loop", "llms.txt").
    if (qTokens.length > 1 && feature.keywords.some((k) => k.toLowerCase().includes(q))) score += 5;
    if (feature.title.toLowerCase().includes(q)) score += 5;

    // At least half the meaningful words must match (all of them for 1–2 word queries).
    const needed = qTokens.length <= 2 ? qTokens.length : Math.ceil(qTokens.length / 2);
    if (score > 0 && matched >= needed) hits.push({ feature, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Window event the workspace listens to: open a tab (and sub-view), switching to Pro if needed. */
export const OPEN_FEATURE_EVENT = "architect:open-feature";
export type OpenFeatureDetail = { tab?: WorkspaceTab; view?: MemoryView; pro?: boolean };
