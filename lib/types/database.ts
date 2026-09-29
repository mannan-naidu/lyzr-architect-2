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

export type Project = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  framework: AgentFramework;
  mode: AppMode;
  github_repo: string | null;
  memory_enabled: boolean;
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
  created_at: string;
};

export type ProjectFile = {
  id: string;
  project_id: string;
  path: string;
  content: string;
  updated_at: string;
};

export type Deployment = {
  id: string;
  project_id: string;
  status: DeploymentStatus;
  url: string | null;
  logs: Json;
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
    };
    Views: Record<never, never>;
    Functions: {
      owns_project: { Args: { p_project_id: string }; Returns: boolean };
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
