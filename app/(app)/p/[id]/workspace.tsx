"use client";

import {
  ActivityIcon,
  ArrowUpIcon,
  BrainIcon,
  ChevronDownIcon,
  CodeIcon,
  EyeIcon,
  RocketIcon,
  ScrollTextIcon,
  SparklesIcon,
} from "lucide-react";
import { useOptimistic, useState, useTransition, type ComponentType, type FormEvent } from "react";
import { toast } from "sonner";

import { GitHubIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_MODEL_ID, MODELS, PROVIDER_LABELS, type ProviderId } from "@/lib/models";
import { FRAMEWORK_LABELS, type AppMode, type Project } from "@/lib/types/database";

import { setProjectMode } from "./actions";

type WorkspaceProject = Pick<
  Project,
  "id" | "name" | "description" | "framework" | "mode" | "memory_enabled" | "github_repo"
>;

type PanelTab = {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  proOnly?: boolean;
  title: string;
  body: string;
};

const PANEL_TABS: PanelTab[] = [
  {
    value: "preview",
    label: "Preview",
    icon: EyeIcon,
    title: "Live preview",
    body: "Your agent's UI renders here with Sandpack as Architect writes files. (Session 2)",
  },
  {
    value: "code",
    label: "Code",
    icon: CodeIcon,
    title: "Code",
    body: "Generated files and diffs. Pro mode adds the file tree. (Session 6)",
  },
  {
    value: "memory",
    label: "Memory",
    icon: BrainIcon,
    title: "Memory",
    body: "Everything Architect remembers about you and this project — view, edit or delete any memory. (Session 3)",
  },
  {
    value: "deploy",
    label: "Deploy",
    icon: RocketIcon,
    title: "Deploy",
    body: "Ship your agent and watch the build logs stream in. (Session 5)",
  },
  {
    value: "logs",
    label: "Logs",
    icon: ScrollTextIcon,
    proOnly: true,
    title: "Logs",
    body: "Runtime and sandbox logs. (Session 6)",
  },
  {
    value: "trace",
    label: "Trace",
    icon: ActivityIcon,
    proOnly: true,
    title: "Agent trace",
    body: "Every step the builder agent took: plan, memory recall, tool calls, file writes. (Session 6)",
  },
];

const comingSoon = (what: string, session: number) =>
  toast.info(`${what} is coming in Session ${session}.`, { description: "Stubbed in the Session 1 shell." });

export function Workspace({ project }: { project: WorkspaceProject }) {
  const [mode, setOptimisticMode] = useOptimistic<AppMode>(project.mode);
  const [, startTransition] = useTransition();
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID);
  const model = MODELS.find((m) => m.id === modelId) ?? MODELS[0];

  const changeMode = (next: string) => {
    if (next !== "simple" && next !== "pro") return;
    startTransition(async () => {
      setOptimisticMode(next);
      const result = await setProjectMode({ projectId: project.id, mode: next });
      if ("error" in result) toast.error(`Couldn't switch mode: ${result.error}`);
    });
  };

  const tabs = PANEL_TABS.filter((tab) => mode === "pro" || !tab.proOnly);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <h1 className="truncate font-medium">{project.name}</h1>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {FRAMEWORK_LABELS[project.framework]}
        </Badge>
        {project.memory_enabled ? (
          <Badge variant="outline" className="hidden gap-1 sm:inline-flex">
            <BrainIcon className="size-3" /> Memory on
          </Badge>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <Tabs value={mode} onValueChange={changeMode}>
            <TabsList aria-label="Workspace mode">
              <TabsTrigger value="simple">Simple</TabsTrigger>
              <TabsTrigger value="pro">Pro</TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <SparklesIcon className="size-3.5" />
                <span className="hidden md:inline">{model.label}</span>
                <ChevronDownIcon className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuRadioGroup value={modelId} onValueChange={setModelId}>
                {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((provider, i) => (
                  <DropdownMenuGroup key={provider}>
                    {i > 0 ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      {PROVIDER_LABELS[provider]}
                    </DropdownMenuLabel>
                    {MODELS.filter((m) => m.provider === provider).map((m) => (
                      <DropdownMenuRadioItem key={m.id} value={m.id}>
                        {m.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuGroup>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="outline" size="sm" onClick={() => comingSoon("Push to GitHub", 4)}>
            <GitHubIcon className="size-3.5" />
            <span className="hidden md:inline">GitHub</span>
          </Button>
          <Button size="sm" onClick={() => comingSoon("Deploy", 5)}>
            <RocketIcon className="size-3.5" />
            <span className="hidden md:inline">Deploy</span>
          </Button>
        </div>
      </div>

      {/* ── Body: chat | panels ─────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ChatPanel project={project} modelLabel={model.label} />

        <Tabs defaultValue="preview" className="flex min-h-0 flex-1 flex-col gap-0 border-t md:border-t-0 md:border-l">
          <div className="border-b px-3 py-2">
            <TabsList>
              {tabs.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value}>
                  <Icon className="size-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {tabs.map(({ value, icon: Icon, title, body }) => (
            <TabsContent key={value} value={value} className="flex min-h-0 flex-1 items-center justify-center p-6">
              <div className="max-w-sm space-y-2 text-center">
                <Icon className="mx-auto size-8 text-muted-foreground" />
                <h2 className="font-medium">{title}</h2>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

function ChatPanel({ project, modelLabel }: { project: WorkspaceProject; modelLabel: string }) {
  const [draft, setDraft] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    comingSoon("Streaming chat", 2);
  };

  return (
    <section aria-label="Chat" className="flex min-h-0 w-full flex-col md:w-[400px] md:shrink-0">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">Hi! I&apos;m Architect.</p>
            <p className="mt-1 text-muted-foreground">
              {project.description
                ? `Let's build: “${project.description}”. Tell me more about who will use it.`
                : "Describe the agent you want and I'll plan it, write the files and show you a preview."}
            </p>
          </div>
        </div>
      </ScrollArea>
      <form onSubmit={onSubmit} className="border-t p-3">
        <div className="rounded-lg border bg-card p-1.5 focus-within:ring-2 focus-within:ring-ring/50">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={2}
            placeholder="Ask Architect to build or change something…"
            className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="flex items-center justify-between px-1.5">
            <span className="text-xs text-muted-foreground">{modelLabel}</span>
            <Button type="submit" size="icon" className="size-7" aria-label="Send">
              <ArrowUpIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
