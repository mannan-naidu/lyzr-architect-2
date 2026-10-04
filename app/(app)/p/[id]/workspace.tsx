"use client";

import {
  ActivityIcon,
  BrainIcon,
  ChevronDownIcon,
  CodeIcon,
  EyeIcon,
  RocketIcon,
  ScrollTextIcon,
  SparklesIcon,
} from "lucide-react";
import { useOptimistic, useState, useTransition, type ComponentType } from "react";
import { toast } from "sonner";

import { ChatPanel } from "@/components/chat/chat-panel";
import { GitHubIcon } from "@/components/icons";
import { ProductTour, WORKSPACE_TOUR } from "@/components/product-tour";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ArchitectUIMessage } from "@/lib/chat/types";
import { defaultModelFor, MODELS, PROVIDER_LABELS, type ProviderId } from "@/lib/models";
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
    body: "Your agent's UI renders here with Sandpack as Architect writes files.",
  },
  {
    value: "code",
    label: "Code",
    icon: CodeIcon,
    title: "Code",
    body: "Generated files and diffs. Pro mode adds the file tree.",
  },
  {
    value: "memory",
    label: "Memory",
    icon: BrainIcon,
    title: "Memory",
    body: "Everything Architect remembers about you and this project — view, edit or delete any memory.",
  },
  {
    value: "deploy",
    label: "Deploy",
    icon: RocketIcon,
    title: "Deploy",
    body: "Ship your agent and watch the build logs stream in.",
  },
  {
    value: "logs",
    label: "Logs",
    icon: ScrollTextIcon,
    proOnly: true,
    title: "Logs",
    body: "Runtime and sandbox logs.",
  },
  {
    value: "trace",
    label: "Trace",
    icon: ActivityIcon,
    proOnly: true,
    title: "Agent trace",
    body: "Every step the builder agent took: plan, memory recall, tool calls, file writes.",
  },
];

const comingSoon = (what: string) =>
  toast.info(`${what} is coming soon.`, { description: "This flow is being built next." });

export function Workspace({
  project,
  initialMessages,
  availableProviders,
}: {
  project: WorkspaceProject;
  initialMessages: ArchitectUIMessage[];
  /** Providers with an API key configured on the server; other models show as unavailable. */
  availableProviders: ProviderId[];
}) {
  const [mode, setOptimisticMode] = useOptimistic<AppMode>(project.mode);
  const [, startTransition] = useTransition();
  const [modelId, setModelId] = useState<string>(() => defaultModelFor(availableProviders).id);
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
        <span className="size-1.5 shrink-0 rounded-full bg-[var(--green)]" aria-hidden />
        <h1 className="truncate font-mono text-xs font-normal tracking-normal">
          <span className="text-muted-foreground">workspace / </span>
          {project.name}
        </h1>
        <span className="label-mono hidden text-primary sm:inline">{FRAMEWORK_LABELS[project.framework]}</span>
        {project.memory_enabled ? (
          <span className="label-mono hidden items-center gap-1 text-muted-foreground sm:inline-flex">
            <BrainIcon className="size-3" /> Memory on
          </span>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <Tabs value={mode} onValueChange={changeMode} data-tour="mode-switch">
            <TabsList aria-label="Workspace mode">
              <TabsTrigger value="simple">Simple</TabsTrigger>
              <TabsTrigger value="pro">Pro</TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" data-tour="model-picker">
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
                    {MODELS.filter((m) => m.provider === provider).map((m) => {
                      const enabled = availableProviders.includes(m.provider);
                      return (
                        <DropdownMenuRadioItem key={m.id} value={m.id} disabled={!enabled}>
                          <span className="flex-1">{m.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {enabled ? m.hint : "no key"}
                          </span>
                        </DropdownMenuRadioItem>
                      );
                    })}
                  </DropdownMenuGroup>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2" data-tour="ship">
          <Button variant="outline" size="sm" onClick={() => comingSoon("Push to GitHub")}>
            <GitHubIcon className="size-3.5" />
            <span className="hidden md:inline">GitHub</span>
          </Button>
          <Button size="sm" onClick={() => comingSoon("Deploy")}>
            <RocketIcon className="size-3.5" />
            <span className="hidden md:inline">Deploy</span>
          </Button>
          </div>
        </div>
      </div>

      <ProductTour steps={WORKSPACE_TOUR} />

      {/* ── Body: chat | panels ─────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ChatPanel
          projectId={project.id}
          projectDescription={project.description}
          modelId={model.id}
          initialMessages={initialMessages}
        />

        <Tabs
          defaultValue="preview"
          data-tour="panels"
          className="flex min-h-0 flex-1 flex-col gap-0 border-t md:border-t-0 md:border-l"
        >
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
