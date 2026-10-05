"use client";

import {
  ActivityIcon,
  BotIcon,
  BrainIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  CodeIcon,
  EyeIcon,
  FileTextIcon,
  RocketIcon,
  ScrollTextIcon,
  SearchIcon,
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
import { FRAMEWORK_LABELS, type AgentFramework, type AppMode } from "@/lib/types/database";

import { setProjectMode } from "./actions";
import { AgentsPanel } from "./panels/agents-panel";
import { CodePanel } from "./panels/code-panel";
import { ContentPanel } from "./panels/content-panel";
import { LogsPanel, TracePanel } from "./panels/logs-panel";
import { MemoryPanel } from "./panels/memory-panel";
import { PlanPanel } from "./panels/plan-panel";
import { PreviewPanel } from "./panels/preview-panel";
import { ShipPanel } from "./panels/ship-panel";
import { useWorkspace, WorkspaceProvider, type WorkspaceData } from "./workspace-context";

type PanelTab = {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  proOnly?: boolean;
  /** Only shown when the project has content mode on. */
  cmsOnly?: boolean;
};

const PANEL_TABS: PanelTab[] = [
  { value: "plan", label: "Plan", icon: ClipboardListIcon },
  { value: "preview", label: "Preview", icon: EyeIcon },
  { value: "code", label: "Code", icon: CodeIcon },
  { value: "memory", label: "Memory", icon: BrainIcon },
  { value: "agents", label: "Agents", icon: BotIcon },
  { value: "content", label: "Content", icon: FileTextIcon, cmsOnly: true },
  { value: "ship", label: "Ship", icon: RocketIcon },
  { value: "logs", label: "Logs", icon: ScrollTextIcon, proOnly: true },
  { value: "trace", label: "Trace", icon: ActivityIcon, proOnly: true },
];

export function Workspace({
  data,
  initialMessages,
  availableProviders,
}: {
  data: WorkspaceData;
  initialMessages: ArchitectUIMessage[];
  /** Providers with an API key configured on the server; other models show as unavailable. */
  availableProviders: ProviderId[];
}) {
  const [modelId, setModelId] = useState<string>(() => defaultModelFor(availableProviders).id);

  return (
    <WorkspaceProvider data={data} modelId={modelId}>
      <WorkspaceShell
        initialMessages={initialMessages}
        availableProviders={availableProviders}
        modelId={modelId}
        setModelId={setModelId}
      />
    </WorkspaceProvider>
  );
}

function WorkspaceShell({
  initialMessages,
  availableProviders,
  modelId,
  setModelId,
}: {
  initialMessages: ArchitectUIMessage[];
  availableProviders: ProviderId[];
  modelId: string;
  setModelId: (id: string) => void;
}) {
  const { project, activeTab, setActiveTab } = useWorkspace();
  const [mode, setOptimisticMode] = useOptimistic<AppMode>(project.mode);
  const [, startTransition] = useTransition();
  const model = MODELS.find((m) => m.id === modelId) ?? MODELS[0];

  const changeMode = (next: string) => {
    if (next !== "simple" && next !== "pro") return;
    startTransition(async () => {
      setOptimisticMode(next);
      const result = await setProjectMode({ projectId: project.id, mode: next });
      if ("error" in result) toast.error(`Couldn't switch mode: ${result.error}`);
    });
  };

  const pro = mode === "pro";
  const tabs = PANEL_TABS.filter((t) => (pro || !t.proOnly) && (project.cms_enabled || !t.cmsOnly));
  const current = tabs.some((t) => t.value === activeTab) ? activeTab : "preview";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <span className="size-1.5 shrink-0 rounded-full bg-[var(--green)]" aria-hidden />
        <h1 className="truncate font-mono text-xs font-normal tracking-normal">
          <span className="text-muted-foreground">workspace / </span>
          {project.name}
        </h1>
        <span className="label-mono hidden text-primary sm:inline">
          {FRAMEWORK_LABELS[project.framework as AgentFramework] ?? project.framework}
        </span>
        {project.memory_enabled ? (
          <span className="label-mono hidden items-center gap-1 text-muted-foreground sm:inline-flex">
            <BrainIcon className="size-3" /> Memory on
          </span>
        ) : null}
        {project.seo_enabled ? (
          <span className="label-mono hidden items-center gap-1 text-muted-foreground sm:inline-flex">
            <SearchIcon className="size-3" /> SEO + GEO
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
            <DropdownMenuContent align="end" className="w-64">
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
                          <span className="text-xs text-muted-foreground">{enabled ? m.hint : "no key"}</span>
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
            <Button variant="outline" size="sm" onClick={() => setActiveTab("ship")}>
              <GitHubIcon className="size-3.5" />
              <span className="hidden md:inline">GitHub</span>
            </Button>
            <Button size="sm" onClick={() => setActiveTab("ship")}>
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
          value={current}
          onValueChange={setActiveTab}
          data-tour="panels"
          className="flex min-h-0 flex-1 flex-col gap-0 border-t md:border-t-0 md:border-l"
        >
          <div className="overflow-x-auto border-b px-3 py-2">
            <TabsList>
              {tabs.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value}>
                  <Icon className="size-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="plan" className="min-h-0 flex-1 overflow-y-auto">
            <PlanPanel />
          </TabsContent>
          <TabsContent value="preview" className="min-h-0 flex-1" forceMount hidden={current !== "preview"}>
            <PreviewPanel />
          </TabsContent>
          <TabsContent value="code" className="min-h-0 flex-1">
            <CodePanel pro={pro} />
          </TabsContent>
          <TabsContent value="memory" className="min-h-0 flex-1 overflow-y-auto">
            <MemoryPanel />
          </TabsContent>
          <TabsContent value="agents" className="min-h-0 flex-1 overflow-y-auto">
            <AgentsPanel pro={pro} />
          </TabsContent>
          {project.cms_enabled ? (
            <TabsContent value="content" className="min-h-0 flex-1 overflow-y-auto">
              <ContentPanel />
            </TabsContent>
          ) : null}
          <TabsContent value="ship" className="min-h-0 flex-1 overflow-y-auto">
            <ShipPanel />
          </TabsContent>
          {pro ? (
            <>
              <TabsContent value="logs" className="min-h-0 flex-1 overflow-y-auto">
                <LogsPanel />
              </TabsContent>
              <TabsContent value="trace" className="min-h-0 flex-1 overflow-y-auto">
                <TracePanel />
              </TabsContent>
            </>
          ) : null}
        </Tabs>
      </div>
    </div>
  );
}
