// Hand-written to match supabase/migrations. Once a Supabase project is linked, regenerate with:
//   pnpm dlx supabase gen types typescript --linked > lib/types/database.ts

export type AppMode = "simple" | "pro";
export type AgentFramework = "lyzr" | "langgraph" | "crewai" | "openai-agents" | "custom";
export type MessageRole = "user" | "assistant" | "system" | "tool";
export type DeploymentStatus = "queued" | "building" | "ready" | "error" | "canceled";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  preferred_mode: AppMode;
  default_model: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanStatus = "none" | "draft" | "approved";

export type Project = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  framework: AgentFramework;
  mode: AppMode;
  github_repo: string | null;
  memory_enabled: boolean;
  plan: Json | null;
  agent_spec: Json | null;
  plan_status: PlanStatus;
  seo_enabled: boolean;
  cms_enabled: boolean;
  deploy_slug: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  project_id: string;
  role: MessageRole;
  content: string;
  model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  billed_to: "user" | "agent";
  kind: "chat" | "plan" | "build" | "fix";
  created_at: string;
};

export type ProjectFile = {
  id: string;
  project_id: string;
  path: string;
  content: string;
  previous_content: string | null;
  updated_by: "agent" | "user";
  updated_at: string;
};

export type RunEventKind = "plan" | "recall" | "tool" | "file" | "error" | "fix" | "deploy" | "log" | "check";

export type RunEvent = {
  id: string;
  project_id: string;
  run_id: string;
  kind: RunEventKind;
  title: string;
  detail: Json;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: string;
};

export type FixOutcome = "pending" | "succeeded" | "failed" | "rolled_back";

export type FixAttempt = {
  id: string;
  project_id: string;
  owner_id: string;
  error_signature: string;
  error_message: string;
  attempt: number;
  fix_summary: string;
  outcome: FixOutcome;
  tokens: number;
  created_at: string;
};

export type Decision = {
  id: string;
  project_id: string;
  text: string;
  source: "plan" | "chat" | "user" | "fix";
  created_at: string;
};

export type GithubConnection = {
  user_id: string;
  login: string | null;
  token_ciphertext: string;
  scopes: string | null;
  updated_at: string;
};

export type CmsEntry = {
  id: string;
  project_id: string;
  collection: "pages" | "posts" | "faqs";
  slug: string;
  title: string;
  body: string;
  status: "draft" | "published";
  updated_at: string;
};

export type MemoryRow = {
  id: string;
  owner_id: string;
  content: string;
  project_ids: string[];
  times_seen: number;
  created_at: string;
  last_seen_at: string;
};

export type Deployment = {
  id: string;
  project_id: string;
  status: DeploymentStatus;
  url: string | null;
  logs: Json;
  seo_score: number | null;
  security_findings: Json;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        Profile,
        Pick<Profile, "id"> & Partial<Omit<Profile, "id">>
      >;
      projects: Table<
        Project,
        Pick<Project, "name"> & Partial<Omit<Project, "name">>
      >;
      messages: Table<
        Message,
        Pick<Message, "project_id" | "role" | "content"> &
          Partial<Omit<Message, "project_id" | "role" | "content">>
      >;
      project_files: Table<
        ProjectFile,
        Pick<ProjectFile, "project_id" | "path"> &
          Partial<Omit<ProjectFile, "project_id" | "path">>
      >;
      deployments: Table<
        Deployment,
        Pick<Deployment, "project_id"> & Partial<Omit<Deployment, "project_id">>
      >;
      run_events: Table<
        RunEvent,
        Pick<RunEvent, "project_id" | "run_id" | "kind" | "title"> &
          Partial<Omit<RunEvent, "project_id" | "run_id" | "kind" | "title">>
      >;
      fix_attempts: Table<
        FixAttempt,
        Pick<FixAttempt, "project_id" | "error_signature" | "error_message" | "attempt" | "fix_summary"> &
          Partial<Omit<FixAttempt, "project_id" | "error_signature" | "error_message" | "attempt" | "fix_summary">>
      >;
      decisions: Table<
        Decision,
        Pick<Decision, "project_id" | "text"> & Partial<Omit<Decision, "project_id" | "text">>
      >;
      github_connections: Table<
        GithubConnection,
        Pick<GithubConnection, "token_ciphertext"> & Partial<Omit<GithubConnection, "token_ciphertext">>
      >;
      memories: Table<
        MemoryRow,
        Pick<MemoryRow, "content"> & Partial<Omit<MemoryRow, "content">>
      >;
      cms_entries: Table<
        CmsEntry,
        Pick<CmsEntry, "project_id" | "collection" | "slug" | "title"> &
          Partial<Omit<CmsEntry, "project_id" | "collection" | "slug" | "title">>
      >;
    };
    Views: Record<never, never>;
    Functions: {
      owns_project: { Args: { p_project_id: string }; Returns: boolean };
      memory_upsert: { Args: { p_owner: string; p_project: string; p_content: string }; Returns: string };
      memory_search: {
        Args: { p_owner: string; p_query: string; p_limit?: number };
        Returns: { id: string; content: string; score: number; created_at: string }[];
      };
    };
    Enums: {
      app_mode: AppMode;
      agent_framework: AgentFramework;
      message_role: MessageRole;
      deployment_status: DeploymentStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};

export const AGENT_FRAMEWORKS = [
  "lyzr",
  "langgraph",
  "crewai",
  "openai-agents",
  "custom",
] as const satisfies readonly AgentFramework[];

export const FRAMEWORK_LABELS: Record<AgentFramework, string> = {
  lyzr: "Lyzr",
  langgraph: "LangGraph",
  crewai: "CrewAI",
  "openai-agents": "OpenAI Agents SDK",
  custom: "Custom",
};
