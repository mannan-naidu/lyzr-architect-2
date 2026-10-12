"use client";

import { CheckIcon, LoaderIcon, PlugIcon, SparklesIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { getGitHubStatus } from "./ship-actions";
import { useWorkspace } from "./workspace-context";

/**
 * Connectors (mock-up). Lists the apps an Architect project and its agents can use. GitHub and
 * WordPress are real today (Ship → GitHub, Content → Import); the rest simulate an OAuth connect
 * and are remembered in this browser only. Production design: each connector is an OAuth app with
 * encrypted tokens (as GitHub is today), exposed to agents as tools over MCP.
 */
type Connector = {
  id: string;
  name: string;
  mark: string;
  group: "Knowledge" | "Communication" | "Business apps" | "Developer";
  description: string;
  /** Words in a planned agent's tools that make this connector a suggestion. */
  suggestWhen: string[];
  real?: "github" | "wordpress";
};

const CONNECTORS: Connector[] = [
  { id: "drive", name: "Google Drive", mark: "GD", group: "Knowledge", description: "Docs and PDFs agents can search and cite.", suggestWhen: ["document", "pdf", "doc", "file", "drive"] },
  { id: "notion", name: "Notion", mark: "N", group: "Knowledge", description: "Wiki pages as an agent knowledge base.", suggestWhen: ["notion", "wiki", "knowledge"] },
  { id: "lyzr-kb", name: "Lyzr Knowledge Base", mark: "LK", group: "Knowledge", description: "Managed RAG for Lyzr agents.", suggestWhen: ["knowledge", "faq", "search", "answer"] },
  { id: "wordpress", name: "WordPress", mark: "WP", group: "Knowledge", description: "Import pages and posts into Content mode.", suggestWhen: ["wordpress", "blog", "post"], real: "wordpress" },
  { id: "slack", name: "Slack", mark: "SL", group: "Communication", description: "Notify channels and escalate to people.", suggestWhen: ["slack", "escalat", "notify", "alert"] },
  { id: "gmail", name: "Gmail", mark: "GM", group: "Communication", description: "Read and send email on the user's behalf.", suggestWhen: ["email", "mail", "send"] },
  { id: "teams", name: "Microsoft Teams", mark: "MT", group: "Communication", description: "Post updates to Teams channels.", suggestWhen: ["teams"] },
  { id: "hubspot", name: "HubSpot", mark: "HS", group: "Business apps", description: "Contacts, deals and lead scoring.", suggestWhen: ["lead", "crm", "contact", "deal"] },
  { id: "salesforce", name: "Salesforce", mark: "SF", group: "Business apps", description: "Accounts, opportunities and cases.", suggestWhen: ["salesforce", "opportunit", "account"] },
  { id: "stripe", name: "Stripe", mark: "ST", group: "Business apps", description: "Payments, subscriptions and invoices.", suggestWhen: ["payment", "pay", "invoice", "billing", "checkout"] },
  { id: "zendesk", name: "Zendesk", mark: "ZD", group: "Business apps", description: "Support tickets and macros.", suggestWhen: ["ticket", "support"] },
  { id: "github", name: "GitHub", mark: "GH", group: "Developer", description: "Create a repo and push your app.", suggestWhen: [], real: "github" },
  { id: "postgres", name: "Postgres", mark: "PG", group: "Developer", description: "Query your own database (read-only by default).", suggestWhen: ["database", "sql", "query", "record"] },
  { id: "webhook", name: "Webhooks", mark: "WH", group: "Developer", description: "Call any HTTPS endpoint from an agent.", suggestWhen: ["webhook", "api", "http"] },
  { id: "mcp", name: "Custom MCP server", mark: "MCP", group: "Developer", description: "Bring any tool that speaks MCP.", suggestWhen: ["mcp"] },
];

const GROUPS: Connector["group"][] = ["Knowledge", "Communication", "Business apps", "Developer"];

function storageKey(projectId: string) {
  return `architect:connectors:${projectId}`;
}

function loadConnected(projectId: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function ConnectorsDialog() {
  const { project, plan, setActiveTab } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [github, setGithub] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    // Read local state and the real GitHub connection each time the dialog opens.
    queueMicrotask(() => live && setConnected(loadConnected(project.id)));
    getGitHubStatus({ projectId: project.id })
      .then((s) => live && setGithub(s.connected ? (s.login ?? "connected") : null))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [open, project.id]);

  const save = (next: string[]) => {
    setConnected(next);
    try {
      window.localStorage.setItem(storageKey(project.id), JSON.stringify(next));
    } catch {
      // Private mode etc.: the mock-up still works for this session.
    }
  };

  // Suggest connectors whose keywords appear in the plan's agent tools and roles.
  const suggested = useMemo(() => {
    const text = (plan?.agents ?? []).flatMap((a) => [...a.tools, a.role]).join(" ").toLowerCase();
    return new Set(CONNECTORS.filter((c) => c.suggestWhen.some((w) => text.includes(w))).map((c) => c.id));
  }, [plan]);

  const connect = (id: string) => {
    setPending(id);
    window.setTimeout(() => {
      save([...new Set([...connected, id])]);
      setPending(null);
    }, 900);
  };

  const count = connected.length + (github ? 1 : 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-tour="connectors" aria-label="Connectors">
          <PlugIcon className="size-3.5" />
          <span className="hidden lg:inline">Connectors</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(90dvh,760px)] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2">
            <PlugIcon className="size-4" /> Connectors
            {count ? <span className="label-mono text-primary">{count} connected</span> : null}
          </DialogTitle>
          <DialogDescription>
            Apps your project and its agents can use. Agents get each connected app as a tool.
          </DialogDescription>
          <p className="mt-1 border border-dashed px-3 py-2 text-xs text-muted-foreground">
            Preview: GitHub and WordPress are live; the others simulate the connect step and are saved in this browser.
            In production each is an OAuth app with encrypted tokens, served to agents over MCP.
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {GROUPS.map((group) => (
            <section key={group} className="space-y-2">
              <h3 className="label-mono text-muted-foreground">{group}</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {CONNECTORS.filter((c) => c.group === group).map((c) => {
                  const isOn = c.real === "github" ? Boolean(github) : connected.includes(c.id);
                  return (
                    <li key={c.id} className={cn("flex items-start gap-3 border p-3", isOn && "border-primary/50 bg-primary/5")}>
                      <span className="grid size-9 shrink-0 place-items-center border bg-card font-mono text-[10px] font-semibold">
                        {c.mark}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium">{c.name}</span>
                          {suggested.has(c.id) && !isOn ? (
                            <span className="label-mono inline-flex items-center gap-1 text-[10px] text-primary">
                              <SparklesIcon className="size-2.5" /> Suggested by your plan
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                        <ConnectorAction
                          connector={c}
                          isOn={isOn}
                          githubLogin={github}
                          pending={pending === c.id}
                          cmsEnabled={project.cms_enabled}
                          onConnect={() => connect(c.id)}
                          onDisconnect={() => save(connected.filter((x) => x !== c.id))}
                          onOpenTab={(tab) => {
                            setOpen(false);
                            setActiveTab(tab);
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConnectorAction({
  connector,
  isOn,
  githubLogin,
  pending,
  cmsEnabled,
  onConnect,
  onDisconnect,
  onOpenTab,
}: {
  connector: Connector;
  isOn: boolean;
  githubLogin: string | null;
  pending: boolean;
  cmsEnabled: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenTab: (tab: string) => void;
}) {
  if (connector.real === "github") {
    return isOn ? (
      <span className="label-mono inline-flex items-center gap-1 text-[10px] text-[var(--green)]">
        <CheckIcon className="size-3" /> Live · @{githubLogin}
      </span>
    ) : (
      <Button size="xs" variant="outline" onClick={() => onOpenTab("ship")}>
        Connect in Ship
      </Button>
    );
  }
  if (connector.real === "wordpress") {
    return (
      <Button size="xs" variant="outline" onClick={() => onOpenTab(cmsEnabled ? "content" : "ship")}>
        {cmsEnabled ? "Import in Content" : "Turn on Content mode in Ship"}
      </Button>
    );
  }
  if (isOn) {
    return (
      <span className="flex items-center gap-2">
        <span className="label-mono inline-flex items-center gap-1 text-[10px] text-[var(--green)]">
          <CheckIcon className="size-3" /> Connected · demo
        </span>
        <button onClick={onDisconnect} className="label-mono text-[10px] text-muted-foreground hover:text-foreground">
          Disconnect
        </button>
      </span>
    );
  }
  return (
    <Button size="xs" variant="outline" onClick={onConnect} disabled={pending}>
      {pending ? <LoaderIcon className="size-3 animate-spin" /> : null}
      {pending ? "Connecting…" : "Connect"}
    </Button>
  );
}
