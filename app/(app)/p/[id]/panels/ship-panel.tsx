"use client";

import {
  CheckCircle2Icon,
  CircleIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
  LoaderIcon,
  RocketIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UploadIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { GitHubIcon } from "@/components/icons";
import { SwitchToggle } from "@/components/switch-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { seoAudit } from "@/lib/ship/seo";
import { securityScan, type SecurityFinding } from "@/lib/ship/security";
import { cn } from "@/lib/utils";
import { signInWithProvider } from "@/app/login/actions";

import { setProjectFlags } from "../actions";
import { deployProject, getGitHubStatus, listDeployments, previewSeoFiles, pushToGitHub } from "../ship-actions";
import { useWorkspace } from "../workspace-context";

type DeploymentRow = { id: string; status: string; url: string | null; logs: unknown; seo_score: number | null; created_at: string };

/** Ship: pre-deploy checks (security, SEO/GEO), deploy, GitHub, content mode. */
export function ShipPanel() {
  const { project, files } = useWorkspace();
  const [seoOn, setSeoOptimistic] = useOptimistic(project.seo_enabled);
  const [cmsOn, setCmsOptimistic] = useOptimistic(project.cms_enabled);
  const [, startFlag] = useTransition();
  const findings = useMemo(() => securityScan(files), [files]);
  const audit = useMemo(() => seoAudit(files, seoOn), [files, seoOn]);

  const flag = (key: "seo_enabled" | "cms_enabled", next: boolean) =>
    startFlag(async () => {
      (key === "seo_enabled" ? setSeoOptimistic : setCmsOptimistic)(next);
      const result = await setProjectFlags({ projectId: project.id, [key]: next });
      if ("error" in result) toast.error(result.error);
    });

  return (
    <div className="grid gap-4 p-6 xl:grid-cols-2">
      <div className="space-y-1 xl:col-span-2">
        <span className="label-mono text-primary">Ship</span>
        <h2 className="text-xl font-semibold">Check, publish, own your code</h2>
      </div>

      <DeployCard findings={findings} />
      <GitHubCard />

      {/* Security */}
      <section className="space-y-3 border p-4">
        <header className="flex items-center gap-2">
          {findings.some((f) => f.severity === "high") ? (
            <ShieldAlertIcon className="size-4 text-destructive" />
          ) : (
            <ShieldCheckIcon className="size-4 text-[var(--green)]" />
          )}
          <h3 className="font-medium">Security pre-check</h3>
          <span className="label-mono ml-auto text-muted-foreground">runs before every deploy</span>
        </header>
        {!files.length ? (
          <p className="text-sm text-muted-foreground">Build the app to run the check.</p>
        ) : findings.length === 0 ? (
          <p className="text-sm">No secrets in client code, no raw HTML injection, no eval. Good to ship.</p>
        ) : (
          <ul className="space-y-2">
            {findings.map((f, i) => (
              <li key={i} className="text-sm">
                <span
                  className={cn(
                    "label-mono mr-2",
                    f.severity === "high" ? "text-destructive" : f.severity === "medium" ? "text-[var(--yellow)]" : "text-muted-foreground",
                  )}
                >
                  {f.severity}
                </span>
                {f.title} <span className="font-mono text-xs text-muted-foreground">{f.file}</span>
                <span className="block text-xs text-muted-foreground">{f.fix}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="label-mono text-muted-foreground">checks: secrets · injection · eval · http · token storage</p>
      </section>

      {/* SEO / GEO */}
      <section className="space-y-3 border p-4">
        <header className="flex items-center gap-2">
          <SearchIcon className="size-4 text-primary" />
          <h3 className="font-medium">SEO + GEO</h3>
          <span className="ml-auto flex items-center gap-2 text-xs">
            {seoOn ? "On" : "Off"}
            <SwitchToggle checked={seoOn} onCheckedChange={(v) => flag("seo_enabled", v)} label="SEO and GEO optimisation" />
          </span>
        </header>
        <div className="flex items-center gap-4">
          <div className="chamfer-sm flex size-16 shrink-0 flex-col items-center justify-center border">
            <span className="text-xl font-semibold">{files.length ? audit.score : "–"}</span>
            <span className="label-mono text-muted-foreground">/100</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Get found on Google <em>and</em> quoted by ChatGPT, Perplexity and Claude. The toggle adds meta tags, a sitemap,
            robots.txt, JSON-LD and an <code>llms.txt</code> for AI answer engines.
          </p>
        </div>
        <ul className="grid gap-1 sm:grid-cols-2">
          {audit.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-1.5 text-xs" title={c.ok ? undefined : c.fix}>
              {c.ok ? (
                <CheckCircle2Icon className="mt-px size-3.5 shrink-0 text-[var(--green)]" />
              ) : (
                <CircleIcon className="mt-px size-3.5 shrink-0 text-muted-foreground" />
              )}
              <span>
                {c.label}
                {c.geo ? <span className="label-mono ml-1 text-primary">geo</span> : null}
              </span>
            </li>
          ))}
        </ul>
        {seoOn ? <SeoFilesPreview /> : null}
      </section>

      {/* Content mode */}
      <section className="flex items-start gap-3 border p-4 xl:col-span-2">
        <FileTextIcon className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="flex-1">
          <h3 className="font-medium">Content mode (CMS)</h3>
          <p className="text-sm text-muted-foreground">
            Manage pages, posts and FAQs without touching code, or import them from a WordPress site. Published FAQs feed the
            GEO structured data automatically.
          </p>
        </div>
        <SwitchToggle checked={cmsOn} onCheckedChange={(v) => flag("cms_enabled", v)} label="Content mode" />
      </section>
    </div>
  );
}

function SeoFilesPreview() {
  const { project } = useWorkspace();
  const [files, setFiles] = useState<Record<string, string> | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    previewSeoFiles({ projectId: project.id })
      .then((r) => {
        if (live && "files" in r) setFiles(r.files ?? null);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [project.id]);
  if (!files) return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {Object.keys(files).map((p) => (
          <Button key={p} size="xs" variant={open === p ? "secondary" : "outline"} onClick={() => setOpen(open === p ? null : p)}>
            {p.slice(1)}
          </Button>
        ))}
      </div>
      {open ? <pre className="max-h-48 overflow-auto border bg-muted/30 p-2 font-mono text-[11px] leading-4">{files[open]}</pre> : null}
    </div>
  );
}

function DeployCard({ findings }: { findings: SecurityFinding[] }) {
  const { project, files } = useWorkspace();
  const [history, setHistory] = useState<DeploymentRow[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "deploying" | "done">("idle");
  const [busy, start] = useTransition();

  const load = useCallback(async () => {
    const r = await listDeployments({ projectId: project.id });
    if ("deployments" in r && r.deployments) setHistory(r.deployments);
  }, [project.id]);

  useEffect(() => {
    let live = true;
    listDeployments({ projectId: project.id })
      .then((r) => {
        if (live && "deployments" in r && r.deployments) setHistory(r.deployments);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [project.id]);

  const deploy = (force = false) =>
    start(async () => {
      setPhase("deploying");
      setLines([]);
      const result = await deployProject({ projectId: project.id, force });
      if ("error" in result) {
        toast.error(result.error);
        setPhase("idle");
        return;
      }
      if ("blocked" in result) {
        setPhase("idle");
        toast.error("Deploy blocked by the security check", {
          description: "Fix the high-severity findings, or deploy anyway.",
          action: { label: "Deploy anyway", onClick: () => deploy(true) },
        });
        return;
      }
      const logLines = Array.isArray(result.deployment.logs) ? result.deployment.logs.map(String) : [];
      for (const line of logLines) {
        setLines((prev) => [...prev, line]);
        await new Promise((r) => setTimeout(r, 350));
      }
      setPhase("done");
      toast.success("Deployed", { description: result.deployment.url ?? undefined });
      await load();
    });

  const latest = history[0];

  return (
    <section className="space-y-3 border p-4">
      <header className="flex items-center gap-2">
        <RocketIcon className="size-4 text-primary" />
        <h3 className="font-medium">Deploy</h3>
        <span className="label-mono ml-auto text-muted-foreground">simulated hosting</span>
      </header>
      <p className="text-sm text-muted-foreground">
        One click: security pre-check, SEO/GEO files, build, and a live URL with an endpoint for your agents.
      </p>
      <Button onClick={() => deploy()} disabled={busy || !files.length} className="w-full">
        {busy ? <LoaderIcon className="animate-spin" /> : <RocketIcon />}
        {busy ? "Deploying…" : latest ? "Redeploy" : "Deploy"}
        {findings.some((f) => f.severity === "high") ? <ShieldAlertIcon className="text-destructive" /> : null}
      </Button>
      {lines.length || phase === "deploying" ? (
        <pre className="max-h-48 overflow-auto bg-[oklch(0.18_0.01_188)] p-2 font-mono text-[11px] leading-5 text-[oklch(0.85_0.01_90)]">
          {lines.map((l, i) => (
            <div key={i}>
              <span className="text-[var(--green)]">✓</span> {l}
            </div>
          ))}
          {phase === "deploying" ? <div className="animate-pulse">▍</div> : null}
        </pre>
      ) : null}
      {latest?.url ? (
        <a
          href={latest.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 border bg-card px-3 py-2 font-mono text-xs hover:border-primary"
          onClick={(e) => {
            e.preventDefault();
            toast.info("Hosting is simulated in this prototype", { description: `In production this opens ${latest.url}` });
          }}
        >
          <GlobeIcon className="size-3.5 text-[var(--green)]" /> {latest.url}
          <ExternalLinkIcon className="ml-auto size-3.5" />
        </a>
      ) : null}
      {history.length ? (
        <ul className="space-y-1">
          <span className="label-mono text-muted-foreground">History</span>
          {history.slice(0, 5).map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-[var(--green)]" />
              {new Date(d.created_at).toLocaleString()}
              <span className="label-mono ml-auto">seo {d.seo_score ?? "–"}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function GitHubCard() {
  const { project, files } = useWorkspace();
  const [status, setStatus] = useState<{ connected: boolean; login: string | null; repo: string | null } | null>(null);
  const [repoName, setRepoName] = useState(() => project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  const [isPrivate, setIsPrivate] = useState(true);
  const [busy, start] = useTransition();

  useEffect(() => {
    let live = true;
    getGitHubStatus({ projectId: project.id })
      .then((s) => {
        if (live) setStatus(s);
      })
      .catch(() => {
        if (live) setStatus({ connected: false, login: null, repo: null });
      });
    return () => {
      live = false;
    };
  }, [project.id]);

  const push = () =>
    start(async () => {
      const result = await pushToGitHub({ projectId: project.id, repoName: repoName || undefined, isPrivate });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setStatus((s) => (s ? { ...s, repo: result.repo } : s));
      toast.success(`Pushed to ${result.repo}`, { description: `commit ${result.commit}` });
    });

  return (
    <section className="space-y-3 border p-4">
      <header className="flex items-center gap-2">
        <GitHubIcon className="size-4" />
        <h3 className="font-medium">GitHub</h3>
        <span className="label-mono ml-auto text-muted-foreground">
          {status?.connected ? `@${status.login ?? "connected"}` : "not connected"}
        </span>
      </header>
      <p className="text-sm text-muted-foreground">
        Your code, your repo: the app, the agents in your chosen framework, and the SEO files, in one commit.
      </p>
      {!status ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderIcon className="size-3.5 animate-spin" /> Checking…
        </p>
      ) : !status.connected ? (
        <form action={signInWithProvider}>
          <input type="hidden" name="provider" value="github" />
          <input type="hidden" name="next" value={`/p/${project.id}`} />
          <Button type="submit" variant="outline" className="w-full">
            <GitHubIcon /> Connect GitHub
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">Signs in with GitHub (repo scope) and returns here.</p>
        </form>
      ) : (
        <div className="space-y-2">
          {status.repo ? (
            <a
              href={`https://github.com/${status.repo}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 border bg-card px-3 py-2 font-mono text-xs hover:border-primary"
            >
              <GitHubIcon className="size-3.5" /> {status.repo}
              <ExternalLinkIcon className="ml-auto size-3.5" />
            </a>
          ) : (
            <div className="flex items-center gap-2">
              <Input value={repoName} onChange={(e) => setRepoName(e.target.value)} aria-label="Repository name" className="font-mono text-xs" />
              <label className="flex shrink-0 items-center gap-1.5 text-xs">
                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} /> private
              </label>
            </div>
          )}
          <Button onClick={push} disabled={busy || !files.length} className="w-full">
            {busy ? <LoaderIcon className="animate-spin" /> : <UploadIcon />}
            {status.repo ? "Push changes" : "Create repo and push"}
          </Button>
        </div>
      )}
    </section>
  );
}
