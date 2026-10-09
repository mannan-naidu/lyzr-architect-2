import { z } from "zod";

import { AGENT_FRAMEWORKS } from "@/lib/types/database";

// Shared (client-safe) schemas for the plan → build → fix loop. Field descriptions double as
// instructions to the model when used with structured output.

export const agentSchema = z.object({
  name: z.string().describe("Short name, e.g. 'FAQ Answerer'"),
  role: z.string().describe("One sentence: what this agent is responsible for"),
  instructions: z.string().describe("System instructions for the agent, 2-4 sentences"),
  tools: z.array(z.string()).describe("Capabilities it needs, e.g. 'search knowledge base', 'send email'"),
  memory: z.boolean().describe("Whether this agent should remember its end users across sessions"),
  handsOffTo: z.array(z.string()).describe("Names of agents it passes work to; empty if none"),
});

/** What the planner model returns. Every field is required so strict structured output works. */
export const planOutputSchema = z.object({
  title: z.string().describe("App name, 2-4 words"),
  summary: z.string().describe("Two sentences: what the app does and for whom"),
  audience: z.string().describe("Who uses it"),
  userStories: z.array(z.string()).describe("4-6 user stories, 'As a …, I want … so that …'"),
  screens: z
    .array(z.object({ name: z.string(), purpose: z.string() }))
    .describe("2-4 screens of the app UI"),
  agents: z
    .array(agentSchema)
    .describe("0-4 AI agents. Only add agents for work that needs AI (answering, summarising, deciding); return [] for apps that don't, e.g. a marketing site, portfolio or simple tool"),
  dataSources: z.array(z.string()).describe("Documents, APIs or databases the agents use"),
  decisions: z
    .array(z.string())
    .describe("Key build decisions stated as short facts, e.g. 'Styling: Tailwind', 'Auth: none for v1'"),
  openQuestion: z
    .string()
    .describe("The single most important question to ask the user, or an empty string if none"),
  questionOptions: z
    .array(z.string())
    .describe("2-4 short answers to openQuestion the user can pick with one click; [] if there is no question"),
});

/** A stored plan. Plans saved before questionOptions existed parse with no options. */
export const planSchema = planOutputSchema.extend({
  questionOptions: z.array(z.string()).default([]),
});

export type Plan = z.output<typeof planSchema>;
export type PlannedAgent = z.infer<typeof agentSchema>;

export const generatedFilesSchema = z.object({
  files: z
    .array(
      z.object({
        path: z.string().describe("Path like /App.tsx or /components/Chat.tsx"),
        content: z.string().describe("Full file contents"),
      }),
    )
    .describe("Every file of the app. Always include /App.tsx."),
  notes: z.string().describe("One or two sentences on what was built"),
});

export type GeneratedFiles = z.infer<typeof generatedFilesSchema>;

export const fixSchema = z.object({
  diagnosis: z.string().describe("One sentence: the root cause, found from the current code and error"),
  usedKnownFix: z
    .boolean()
    .describe("True only if a fix from the user's history applied because its root cause matches yours"),
  summary: z.string().describe("One sentence: what you changed"),
  files: z
    .array(z.object({ path: z.string(), content: z.string().describe("Full new file contents") }))
    .describe("Only the files you changed, each with its full new contents"),
});

export type FixResult = z.infer<typeof fixSchema>;

export const frameworkSchema = z.enum(AGENT_FRAMEWORKS);
