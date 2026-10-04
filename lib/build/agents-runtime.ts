import type { PlannedAgent } from "@/lib/build/schemas";

/**
 * The `/agents.ts` file injected into every preview. Generated UIs call agents only through
 * `runAgent(name, input)`. In the prototype, runs are simulated in the browser (see README "Real vs
 * simulated"); in production this module is replaced by a client for the project's agent
 * endpoint (`POST /agents/{id}/run`), whatever framework the agents are compiled to.
 */
export function agentsRuntimeFile(agents: readonly PlannedAgent[]): string {
  const catalog = agents.map((a) => ({
    name: a.name,
    role: a.role,
    tools: a.tools,
    memory: a.memory,
  }));

  return `// Provided by Architect. Agent runs are simulated in the preview sandbox.
// In production this calls the project's agent endpoint: POST /agents/{name}/run
export type AgentInfo = { name: string; role: string; tools: string[]; memory: boolean };

export const AGENTS: AgentInfo[] = ${JSON.stringify(catalog, null, 2)};

const memory: Record<string, string[]> = {};

function pick<T>(items: T[], seed: string): T {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return items[h % items.length];
}

export async function runAgent(agentName: string, input: string): Promise<string> {
  const agent = AGENTS.find((a) => a.name.toLowerCase() === agentName.toLowerCase()) ?? AGENTS[0];
  await new Promise((r) => setTimeout(r, 450 + Math.random() * 600));
  if (!agent) return "No agents are configured yet.";

  const remembered = agent.memory ? (memory[agent.name] ??= []) : [];
  const recall = remembered.length ? \` (I remember you asked about "\${remembered[remembered.length - 1]}")\` : "";
  if (agent.memory) remembered.push(input.slice(0, 60));

  const tool = agent.tools.length ? pick(agent.tools, input) : "reasoning";
  const openers = [
    \`Here's what I found using \${tool}\`,
    \`Based on \${tool}\`,
    \`I checked \${tool}\`,
  ];
  return \`\${pick(openers, input)}\${recall}: \${agent.role.replace(/\\.$/, "")} — for "\${input.slice(0, 80)}", the answer is ready. [simulated \${agent.name}]\`;
}
`;
}
