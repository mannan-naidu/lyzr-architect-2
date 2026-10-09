import { ArrowRightIcon, BrainIcon, FileTextIcon, SearchIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK_LABELS } from "@/lib/types/database";

import { NewProjectDialog } from "./new-project-dialog";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

/** One-click starting points for an empty dashboard; each opens the dialog pre-filled. */
const STARTERS = [
  {
    name: "Yoga studio site",
    tag: "SEO + GEO · content · 1 agent",
    options: "seo,cms",
    prompt: "A website for my yoga studio with class schedules, pricing, FAQs and an assistant that answers questions about classes.",
  },
  {
    name: "Support triage agent",
    tag: "Agents · memory",
    options: "",
    prompt: "A support inbox that answers customer questions from our docs and escalates angry customers to Slack.",
  },
  {
    name: "Lead qualifier",
    tag: "SEO + GEO · 2 agents",
    options: "seo",
    prompt: "A landing page that captures leads and an agent that scores them and drafts a follow-up email.",
  },
  {
    name: "Designer portfolio",
    tag: "No AI · SEO + GEO",
    options: "seo,cms",
    prompt: "A one-page portfolio for a product designer with case studies and a contact form.",
  },
];

const FIRST_STEPS = [
  { icon: SparklesIcon, title: "Describe it", body: "Plain English. Architect plans screens, agents and decisions before writing code." },
  { icon: SearchIcon, title: "Get found", body: "Tick SEO + GEO for public sites: static HTML, structured data and llms.txt." },
  { icon: BrainIcon, title: "It remembers", body: "Your style and choices carry into the next project. See and edit them in Memory." },
  { icon: FileTextIcon, title: "Edit without code", body: "Content mode gives you pages, posts and FAQs, with WordPress import." },
];

const starterHref = (s: (typeof STARTERS)[number]) =>
  `/dashboard?${new URLSearchParams({ new: "1", name: s.name, prompt: s.prompt, options: s.options })}`;

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const params = await searchParams;
  const prompt = typeof params.prompt === "string" ? params.prompt.slice(0, 2000) : undefined;
  const name = typeof params.name === "string" ? params.name.slice(0, 100) : undefined;
  const options = typeof params.options === "string" ? params.options.split(",") : [];
  const openNew = Boolean(prompt) || params.new === "1";

  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, description, framework, mode, memory_enabled, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto border-x">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b p-6">
        <div className="space-y-2">
          <span className="label-mono text-primary">Workspace</span>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Agents and apps you&apos;re building.</p>
        </div>
        {/* Arriving from the landing prompt box opens the dialog pre-filled. */}
        <NewProjectDialog
          key={openNew ? `open-${name ?? ""}-${prompt ?? ""}` : "closed"}
          initialPrompt={prompt}
          initialName={name}
          initialSeo={options.includes("seo")}
          initialCms={options.includes("cms")}
          defaultOpen={openNew}
        />
      </div>

      {error ? (
        <p role="alert" className="p-6 text-sm text-destructive">
          Couldn&apos;t load projects: {error.message}
        </p>
      ) : !projects?.length ? (
        <div>
          <section className="border-b p-6 sm:p-8">
            <span className="label-mono text-primary">Start here</span>
            <h2 className="mt-2 text-2xl font-semibold">Pick a starting point, or describe your own</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each one opens the new-project form pre-filled. Change anything before you create it.
            </p>
          </section>
          <ul className="grid border-b sm:grid-cols-2 lg:grid-cols-4">
            {STARTERS.map((s, i) => (
              <li key={s.name} className="border-b sm:border-r lg:border-b-0 lg:last:border-r-0">
                <Link
                  href={starterHref(s)}
                  className="group flex h-full flex-col gap-2 p-6 transition-colors hover:bg-card focus-visible:outline-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="label-mono text-primary">{s.tag}</span>
                    <span className="label-mono text-muted-foreground/60">{String(i + 1).padStart(3, "0")}</span>
                  </div>
                  <h3 className="text-lg font-semibold group-hover:text-primary">{s.name}</h3>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{s.prompt}</p>
                  <span className="label-mono mt-auto inline-flex items-center gap-1 pt-2 text-muted-foreground group-hover:text-primary">
                    Use this <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4">
            {FIRST_STEPS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="space-y-2 border-b p-6 sm:border-r lg:border-b-0 lg:last:border-r-0">
                <Icon className="size-4 text-primary" />
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
          <p className="border-t p-6 text-center text-sm text-muted-foreground">
            Lost? Press <kbd className="rounded border bg-muted px-1.5 font-mono text-xs">⌘K</kbd> to search any feature,
            or start a project to take the quick tour.
          </p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <li key={project.id} className="border-b sm:border-r">
              <Link
                href={`/p/${project.id}`}
                className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-card focus-visible:outline-2"
              >
                <div className="flex items-center justify-between">
                  <span className="label-mono text-primary">{FRAMEWORK_LABELS[project.framework]}</span>
                  <span className="label-mono text-muted-foreground/60">{String(i + 1).padStart(3, "0")}</span>
                </div>
                <h2 className="truncate text-lg font-semibold group-hover:text-primary">{project.name}</h2>
                <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                  {project.description ?? "No description"}
                </p>
                <div className="mt-auto flex items-center gap-3 pt-2">
                  {project.memory_enabled ? (
                    <span className="label-mono inline-flex items-center gap-1 text-muted-foreground">
                      <BrainIcon className="size-3" /> Memory on
                    </span>
                  ) : null}
                  <span className="label-mono ml-auto text-muted-foreground">
                    {dateFormat.format(new Date(project.updated_at))}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
