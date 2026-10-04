"use server";

import { Octokit } from "@octokit/rest";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { generateAgentCode } from "@/lib/agents/codegen";
import { planSchema } from "@/lib/build/schemas";
import { decryptToken } from "@/lib/github/crypto.server";
import { seoAudit, seoFiles } from "@/lib/ship/seo";
import { securityScan } from "@/lib/ship/security";
import { createClient } from "@/lib/supabase/server";
import type { AgentFramework, CmsEntry, Json } from "@/lib/types/database";

const projectIdSchema = z.uuid();

async function loadProject(projectId: string) {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, description, framework, plan, seo_enabled, cms_enabled, github_repo, deploy_slug")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;
  const { data: files } = await supabase.from("project_files").select("path, content").eq("project_id", projectId);
  const plan = planSchema.safeParse(project.plan);
  return { supabase, project, files: files ?? [], plan: plan.success ? plan.data : null };
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "app";

async function faqsFor(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string) {
  const { data } = await supabase
    .from("cms_entries")
    .select("title, body")
    .eq("project_id", projectId)
    .eq("collection", "faqs")
    .eq("status", "published")
    .limit(20);
  return (data ?? []).map((f) => ({ q: f.title, a: f.body.replace(/<[^>]+>/g, "").slice(0, 400) }));
}

// ── Deploy (simulated hosting; real checks) ──────────────────────────────────────────────────

/**
 * Runs the SEO/GEO audit and the security pre-check on the server, then records a deployment.
 * Hosting itself is simulated in the prototype (README "Real vs simulated"); production would
 * hand the build to Vercel's deployments API. High-severity findings block the deploy.
 */
export async function deployProject(input: { projectId: string; force?: boolean }) {
  const { projectId, force } = z.object({ projectId: projectIdSchema, force: z.boolean().optional() }).parse(input);
  const loaded = await loadProject(projectId);
  if (!loaded) return { error: "Project not found." };
  const { supabase, project, files, plan } = loaded;
  if (!files.length) return { error: "Build the app before deploying." };

  const findings = securityScan(files);
  const high = findings.filter((f) => f.severity === "high");
  if (high.length && !force) return { blocked: true as const, findings };

  const slug = project.deploy_slug ?? `${slugify(plan?.title ?? project.name)}-${projectId.slice(0, 6)}`;
  const url = `https://${slug}.architect.run`;
  const { score } = seoAudit(files, project.seo_enabled);
  const extra = project.seo_enabled ? Object.keys(seoFiles(plan, project.name, url)) : [];
  const runId = crypto.randomUUID();
  const lines = [
    `Cloning project ${project.name} (${files.length} files)`,
    "Installing dependencies: react, react-dom, tailwindcss",
    `Security pre-check: ${findings.length ? `${findings.length} finding(s)${high.length ? ", deploying anyway (forced)" : ""}` : "passed"}`,
    project.seo_enabled ? `SEO/GEO: generated ${extra.join(", ")}` : "SEO/GEO: off",
    `SEO/GEO score: ${score}/100`,
    "Building production bundle",
    "Uploading static assets to the edge",
    `Agents endpoint ready: ${url}/agents`,
    `Live at ${url}`,
  ];

  const { data: deployment, error } = await supabase
    .from("deployments")
    .insert({
      project_id: projectId,
      status: "ready",
      url,
      logs: lines,
      seo_score: score,
      security_findings: findings as unknown as Json,
    })
    .select("id, status, url, logs, seo_score, security_findings, created_at")
    .single();
  if (error) return { error: error.message };
  if (!project.deploy_slug) await supabase.from("projects").update({ deploy_slug: slug }).eq("id", projectId);
  await supabase.from("run_events").insert([
    { project_id: projectId, run_id: runId, kind: "check", title: `Security pre-check: ${findings.length} finding(s)`, detail: { findings: findings.length } },
    { project_id: projectId, run_id: runId, kind: "deploy", title: `Deployed to ${url}`, detail: { seo_score: score } },
  ]);
  revalidatePath(`/p/${projectId}`);
  return { ok: true as const, deployment };
}

export async function listDeployments(input: { projectId: string }) {
  const projectId = projectIdSchema.parse(input.projectId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deployments")
    .select("id, status, url, logs, seo_score, security_findings, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) return { error: error.message };
  return { deployments: data };
}

/** The files the SEO/GEO toggle adds at deploy time, for preview in the Ship tab. */
export async function previewSeoFiles(input: { projectId: string }) {
  const projectId = projectIdSchema.parse(input.projectId);
  const loaded = await loadProject(projectId);
  if (!loaded) return { error: "Project not found." };
  const { supabase, project, plan } = loaded;
  const slug = project.deploy_slug ?? `${slugify(plan?.title ?? project.name)}-${projectId.slice(0, 6)}`;
  return { files: seoFiles(plan, project.name, `https://${slug}.architect.run`, await faqsFor(supabase, projectId)) };
}

// ── GitHub (real: Octokit with the user's token) ─────────────────────────────────────────────

async function octokitFor(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.from("github_connections").select("login, token_ciphertext").maybeSingle();
  if (!data) return null;
  try {
    return { octokit: new Octokit({ auth: decryptToken(data.token_ciphertext) }), login: data.login };
  } catch {
    return null;
  }
}

export async function getGitHubStatus(input: { projectId: string }) {
  const projectId = projectIdSchema.parse(input.projectId);
  const supabase = await createClient();
  const [{ data: conn }, { data: project }] = await Promise.all([
    supabase.from("github_connections").select("login, updated_at").maybeSingle(),
    supabase.from("projects").select("github_repo").eq("id", projectId).maybeSingle(),
  ]);
  return { connected: Boolean(conn), login: conn?.login ?? null, repo: project?.github_repo ?? null };
}

/**
 * Push the project to GitHub: creates the repo on first push (auto-initialised so it has a
 * branch), then commits every file in one commit via the Git Data API.
 */
export async function pushToGitHub(input: { projectId: string; repoName?: string; isPrivate?: boolean }) {
  const { projectId, repoName, isPrivate } = z
    .object({
      projectId: projectIdSchema,
      repoName: z.string().regex(/^[A-Za-z0-9._-]{1,100}$/).optional(),
      isPrivate: z.boolean().optional(),
    })
    .parse(input);
  const loaded = await loadProject(projectId);
  if (!loaded) return { error: "Project not found." };
  const { supabase, project, files, plan } = loaded;
  if (!files.length) return { error: "Build the app before pushing." };
  const gh = await octokitFor(supabase);
  if (!gh) return { error: "Connect GitHub first.", needsConnect: true as const };
  const { octokit } = gh;

  try {
    let fullName = project.github_repo;
    if (!fullName) {
      const { data: repo } = await octokit.repos.createForAuthenticatedUser({
        name: repoName ?? slugify(plan?.title ?? project.name),
        description: plan?.summary ?? project.description ?? "Built with Architect",
        private: isPrivate ?? true,
        auto_init: true,
      });
      fullName = repo.full_name;
    }
    const [owner, repo] = fullName.split("/") as [string, string];
    const { data: repoInfo } = await octokit.repos.get({ owner, repo });
    const branch = repoInfo.default_branch;
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    const { data: parent } = await octokit.git.getCommit({ owner, repo, commit_sha: ref.object.sha });

    const agentCode = generateAgentCode(project.framework as AgentFramework, plan?.agents ?? [], plan?.title ?? project.name);
    const all: { path: string; content: string }[] = [
      ...files.map((f) => ({ path: `src${f.path}`, content: f.content })),
      { path: agentCode.filename, content: agentCode.code },
      {
        path: "README.md",
        content: `# ${plan?.title ?? project.name}\n\n${plan?.summary ?? project.description ?? ""}\n\nBuilt with [Architect](https://github.com/mannan-naidu/lyzr-architect-2). The UI is in \`src/\` (React + Tailwind); the agents are in \`${agentCode.filename}\`.\n`,
      },
      ...(project.seo_enabled
        ? Object.entries(seoFiles(plan, project.name, `https://${project.deploy_slug ?? "app"}.architect.run`)).map(([p, c]) => ({
            path: `public${p}`,
            content: c,
          }))
        : []),
    ];

    const { data: tree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: parent.tree.sha,
      tree: all.map((f) => ({ path: f.path, mode: "100644" as const, type: "blob" as const, content: f.content })),
    });
    const { data: commit } = await octokit.git.createCommit({
      owner,
      repo,
      message: `Architect: ${plan?.title ?? project.name}`,
      tree: tree.sha,
      parents: [parent.sha],
    });
    await octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.sha });

    await supabase.from("projects").update({ github_repo: fullName }).eq("id", projectId);
    await supabase.from("run_events").insert({
      project_id: projectId,
      run_id: crypto.randomUUID(),
      kind: "tool",
      title: `Pushed ${all.length} files to ${fullName}`,
      detail: { commit: commit.sha.slice(0, 7) },
    });
    revalidatePath(`/p/${projectId}`);
    return { ok: true as const, repo: fullName, url: `https://github.com/${fullName}`, commit: commit.sha.slice(0, 7) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "GitHub push failed";
    return { error: message.includes("Bad credentials") ? "Your GitHub connection expired. Reconnect GitHub." : message };
  }
}

/** Import: list the user's repos (newest first) to start a project from one. */
export async function listGitHubRepos() {
  const supabase = await createClient();
  const gh = await octokitFor(supabase);
  if (!gh) return { error: "Connect GitHub first." };
  try {
    const { data } = await gh.octokit.repos.listForAuthenticatedUser({ sort: "pushed", per_page: 20 });
    return { repos: data.map((r) => ({ fullName: r.full_name, private: r.private, description: r.description })) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't list repos" };
  }
}

// ── CMS mode ─────────────────────────────────────────────────────────────────────────────────

const entrySchema = z.object({
  projectId: projectIdSchema,
  id: z.uuid().optional(),
  collection: z.enum(["pages", "posts", "faqs"]),
  slug: z.string().trim().regex(/^[a-z0-9-]{1,80}$/, "Use lowercase letters, numbers and dashes"),
  title: z.string().trim().min(1).max(200),
  body: z.string().max(50_000),
  status: z.enum(["draft", "published"]),
});

export async function listCmsEntries(input: { projectId: string }): Promise<{ entries: CmsEntry[] } | { error: string }> {
  const projectId = projectIdSchema.parse(input.projectId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cms_entries")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (error) return { error: error.message };
  return { entries: data };
}

export async function saveCmsEntry(input: z.input<typeof entrySchema>) {
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  const { id, projectId, ...fields } = parsed.data;
  const supabase = await createClient();
  const row = { ...fields, project_id: projectId, updated_at: new Date().toISOString() };
  const { error } = id
    ? await supabase.from("cms_entries").update(row).eq("id", id).eq("project_id", projectId)
    : await supabase.from("cms_entries").upsert(row, { onConflict: "project_id,collection,slug" });
  if (error) return { error: error.message };
  return { ok: true as const };
}

export async function deleteCmsEntry(input: { projectId: string; id: string }) {
  const { projectId, id } = z.object({ projectId: projectIdSchema, id: z.uuid() }).parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("cms_entries").delete().eq("id", id).eq("project_id", projectId);
  if (error) return { error: error.message };
  return { ok: true as const };
}

/** Is this a public https host (not localhost or a private/link-local IP)? Basic SSRF guard. */
function isPublicHttpsUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname;
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) return null; // no IP literals
  return url;
}

/**
 * WordPress connect: imports pages and posts from a public WordPress site via its REST API
 * (/wp-json/wp/v2). Read-only and unauthenticated in the prototype.
 */
export async function importFromWordPress(input: { projectId: string; siteUrl: string }) {
  const { projectId, siteUrl } = z.object({ projectId: projectIdSchema, siteUrl: z.string().max(300) }).parse(input);
  const base = isPublicHttpsUrl(siteUrl);
  if (!base) return { error: "Enter a public https:// WordPress site URL." };
  const supabase = await createClient();

  type WpItem = { slug: string; title: { rendered: string }; content: { rendered: string } };
  const fetchType = async (type: "posts" | "pages"): Promise<WpItem[]> => {
    const res = await fetch(`${base.origin}/wp-json/wp/v2/${type}?per_page=10&_fields=slug,title,content`, {
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    if (!res.ok) throw new Error(`${type}: HTTP ${res.status}`);
    const body: unknown = await res.json();
    return Array.isArray(body) ? (body as WpItem[]) : [];
  };

  try {
    const [posts, pages] = await Promise.all([fetchType("posts"), fetchType("pages")]);
    const strip = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, "").trim();
    const rows = [
      ...posts.map((p) => ({ collection: "posts" as const, p })),
      ...pages.map((p) => ({ collection: "pages" as const, p })),
    ]
      .filter(({ p }) => p.slug && p.title?.rendered)
      .map(({ collection, p }) => ({
        project_id: projectId,
        collection,
        slug: p.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 80),
        title: p.title.rendered.replace(/<[^>]+>/g, "").slice(0, 200),
        body: strip(p.content?.rendered ?? "").slice(0, 50_000),
        status: "published" as const,
        updated_at: new Date().toISOString(),
      }));
    if (!rows.length) return { error: "No posts or pages found at that site." };
    const { error } = await supabase.from("cms_entries").upsert(rows, { onConflict: "project_id,collection,slug" });
    if (error) return { error: error.message };
    return { ok: true as const, imported: rows.length };
  } catch (err) {
    return {
      error: `Couldn't read ${base.hostname}'s WordPress API (${err instanceof Error ? err.message : "unknown error"}). Is it a WordPress site with the REST API on?`,
    };
  }
}
