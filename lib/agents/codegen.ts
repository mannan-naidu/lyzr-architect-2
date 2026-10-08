import type { PlannedAgent } from "@/lib/build/schemas";
import type { AgentFramework } from "@/lib/types/database";

/**
 * Framework adapters: one agent spec (from the approved plan) compiled to each framework.
 * This is how Architect stays agent-agnostic: the spec is the source of truth, frameworks are
 * build targets. Output is a starting point the user owns (pushed to GitHub with the app).
 */
export type GeneratedAgentCode = { filename: string; language: "python" | "typescript"; code: string };

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || "agent";
const camel = (s: string) => slug(s).replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const py = (s: string) => JSON.stringify(s);

function toolStubPy(tool: string): string {
  return `@tool\ndef ${slug(tool)}(query: str) -> str:\n    """${tool.replace(/"/g, "'")}"""\n    raise NotImplementedError("connect ${tool.replace(/"/g, "'")}")\n`;
}

function lyzr(agents: readonly PlannedAgent[], app: string): string {
  return `# ${app}: agents for Lyzr Agent Studio (pip install lyzr-agent-api)
# Memory-enabled agents use Lyzr Cognis long-term memory (the same engine behind Architect's builder memory).
import os
from lyzr_agent_api import AgentAPI, AgentConfig, ChatRequest

client = AgentAPI(x_api_key=os.environ["LYZR_API_KEY"])

AGENTS = {
${agents
  .map(
    (a) => `    ${py(a.name)}: client.create_agent_endpoint(json_body=AgentConfig(
        name=${py(a.name)},
        description=${py(a.role)},
        agent_role=${py(a.role)},
        agent_instructions=${py(a.instructions)},
        provider_id="OpenAI",
        model="gpt-4o-mini",
        temperature=0.3,
        features=[${a.memory ? `{"type": "MEMORY", "config": {"provider": "cognis", "max_messages_context_count": 20}, "priority": 0}` : ""}],
        tools=${JSON.stringify(a.tools)},
    )),`,
  )
  .join("\n")}
}


def run(agent_name: str, user_id: str, message: str) -> str:
    agent = AGENTS[agent_name]
    reply = client.chat_with_agent(json_body=ChatRequest(
        user_id=user_id,  # memory is scoped per end user
        agent_id=agent["agent_id"],
        session_id=f"{user_id}-{agent_name}",
        message=message,
    ))
    return reply["response"]
`;
}

function langgraph(agents: readonly PlannedAgent[], app: string): string {
  const tools = [...new Set(agents.flatMap((a) => a.tools))];
  const entry = agents.find((a) => !agents.some((b) => b.handsOffTo.includes(a.name))) ?? agents[0];
  return `# ${app}: LangGraph supervisor-style graph (pip install langgraph langchain-openai)
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import create_react_agent
from langgraph.store.memory import InMemoryStore  # swap for a Postgres store in production

model = ChatOpenAI(model="gpt-4o-mini")
store = InMemoryStore()  # long-term memory for agents with memory=True


${tools.map(toolStubPy).join("\n\n")}

${agents
  .map(
    (a) => `${slug(a.name)} = create_react_agent(
    model,
    tools=[${a.tools.map(slug).join(", ")}],
    prompt=${py(`${a.role} ${a.instructions}`)},
    name=${py(slug(a.name))},${a.memory ? "\n    store=store," : ""}
)`,
  )
  .join("\n\n")}

graph = StateGraph(MessagesState)
${agents.map((a) => `graph.add_node(${py(slug(a.name))}, ${slug(a.name)})`).join("\n")}
graph.add_edge(START, ${py(slug(entry?.name ?? "agent"))})
${agents
  .flatMap((a) =>
    a.handsOffTo.length
      ? a.handsOffTo.map((t) => `graph.add_edge(${py(slug(a.name))}, ${py(slug(t))})`)
      : [`graph.add_edge(${py(slug(a.name))}, END)`],
  )
  .join("\n")}

app = graph.compile(checkpointer=InMemorySaver(), store=store)

if __name__ == "__main__":
    out = app.invoke({"messages": [("user", "Hello")]}, {"configurable": {"thread_id": "demo"}})
    print(out["messages"][-1].content)
`;
}

function crewai(agents: readonly PlannedAgent[], app: string): string {
  return `# ${app}: CrewAI crew (pip install crewai)
from crewai import Agent, Crew, Process, Task

${agents
  .map(
    (a) => `${slug(a.name)} = Agent(
    role=${py(a.name)},
    goal=${py(a.role)},
    backstory=${py(a.instructions)},
    allow_delegation=${a.handsOffTo.length ? "True" : "False"},
    memory=${a.memory ? "True" : "False"},
)`,
  )
  .join("\n\n")}

${agents
  .map(
    (a) => `${slug(a.name)}_task = Task(
    description=${py(`${a.role} Input: {input}`)},
    expected_output="A concise, correct answer for the end user.",
    agent=${slug(a.name)},
)`,
  )
  .join("\n\n")}

crew = Crew(
    agents=[${agents.map((a) => slug(a.name)).join(", ")}],
    tasks=[${agents.map((a) => `${slug(a.name)}_task`).join(", ")}],
    process=Process.sequential,
    memory=${agents.some((a) => a.memory) ? "True" : "False"},
)

if __name__ == "__main__":
    print(crew.kickoff(inputs={"input": "Hello"}))
`;
}

function openaiAgents(agents: readonly PlannedAgent[], app: string): string {
  const tools = [...new Set(agents.flatMap((a) => a.tools))];
  // Declare agents that are handed off to first.
  const ordered = [...agents].sort((a, b) => a.handsOffTo.length - b.handsOffTo.length);
  const entry = agents.find((a) => !agents.some((b) => b.handsOffTo.includes(a.name))) ?? agents[0];
  return `# ${app}: OpenAI Agents SDK (pip install openai-agents)
import asyncio

from agents import Agent, Runner, SQLiteSession, function_tool


${tools.map((t) => `@function_tool\ndef ${slug(t)}(query: str) -> str:\n    """${t.replace(/"/g, "'")}"""\n    raise NotImplementedError("connect ${t.replace(/"/g, "'")}")`).join("\n\n\n")}


${ordered
  .map(
    (a) => `${slug(a.name)} = Agent(
    name=${py(a.name)},
    instructions=${py(`${a.role} ${a.instructions}`)},
    tools=[${a.tools.map(slug).join(", ")}],
    handoffs=[${a.handsOffTo.map(slug).join(", ")}],
)`,
  )
  .join("\n\n")}


async def main() -> None:
    # Sessions give agents conversation memory per end user.
    session = SQLiteSession("end-user-123")
    result = await Runner.run(${slug(entry?.name ?? "agent")}, "Hello", session=session)
    print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
`;
}

function custom(agents: readonly PlannedAgent[], app: string): string {
  return `// ${app}: framework-free agents on the Vercel AI SDK (pnpm add ai @ai-sdk/anthropic zod)
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

const model = anthropic("claude-sonnet-5-5");

${agents
  .map(
    (a) => `export async function ${camel(a.name)}(input: string, memory: string[] = []) {
  const { text } = await generateText({
    model,
    instructions: ${JSON.stringify(`${a.role} ${a.instructions}`)}${a.memory ? ' + (memory.length ? "\\nKnown about this user:\\n" + memory.join("\\n") : "")' : ""},
    prompt: input,
    tools: {
${a.tools
  .map(
    (t) => `      ${camel(t)}: tool({
        description: ${JSON.stringify(t)},
        inputSchema: z.object({ query: z.string() }),
        execute: async ({ query }) => \`TODO: connect ${t.replace(/`/g, "'")} (\${query})\`,
      }),`,
  )
  .join("\n")}
    },
    stopWhen: stepCountIs(5),
  });
  return text;
}`,
  )
  .join("\n\n")}
`;
}

export function generateAgentCode(
  framework: AgentFramework,
  agents: readonly PlannedAgent[],
  appName: string,
): GeneratedAgentCode {
  switch (framework) {
    case "lyzr":
      return { filename: "agents/lyzr_agents.py", language: "python", code: lyzr(agents, appName) };
    case "langgraph":
      return { filename: "agents/graph.py", language: "python", code: langgraph(agents, appName) };
    case "crewai":
      return { filename: "agents/crew.py", language: "python", code: crewai(agents, appName) };
    case "openai-agents":
      return { filename: "agents/openai_agents.py", language: "python", code: openaiAgents(agents, appName) };
    case "custom":
      return { filename: "agents/agents.ts", language: "typescript", code: custom(agents, appName) };
  }
}
