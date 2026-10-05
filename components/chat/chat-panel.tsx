"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Markdown } from "@/components/chat/markdown";
import { MemoryRecall } from "@/components/chat/memory-recall";
import { UsageLine } from "@/components/chat/usage-line";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { ArchitectUIMessage } from "@/lib/chat/types";
import { findModel } from "@/lib/models";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  projectDescription: string | null;
  modelId: string;
  initialMessages: ArchitectUIMessage[];
};

/**
 * One prompt = one independent run with its own stream. New prompts can be sent while earlier
 * ones are still running; runs stream in parallel and never interrupt each other.
 */
type Run = {
  id: string;
  chat: Chat<ArchitectUIMessage>;
  /** Messages that were context for this run; only what comes after them is rendered. */
  contextLength: number;
};

export function ChatPanel({ projectId, projectDescription, modelId, initialMessages }: Props) {
  const [draft, setDraft] = useState("");
  const [runs, setRuns] = useState<Run[]>([]);
  const [settled, setSettled] = useState<Record<string, ArchitectUIMessage[]>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const running = runs.filter((r) => !settled[r.id]).length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [runs.length]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    // Context = saved history + every run that has already finished. Runs still in flight are
    // left out, so parallel prompts stay independent of each other.
    const context: ArchitectUIMessage[] = [
      ...initialMessages,
      ...runs.flatMap((r) => (settled[r.id] ? settled[r.id].slice(r.contextLength) : [])),
    ];

    const id = crypto.randomUUID();
    const chat = new Chat<ArchitectUIMessage>({
      id,
      messages: context,
      transport: new DefaultChatTransport({ api: `/api/projects/${projectId}/chat` }),
      onFinish: ({ messages }) => setSettled((prev) => ({ ...prev, [id]: messages })),
      onError: () => setSettled((prev) => ({ ...prev, [id]: [] })),
    });
    setRuns((prev) => [...prev, { id, chat, contextLength: context.length }]);
    // The model is sent per prompt, so switching models mid-chat just works.
    void chat.sendMessage({ text }, { body: { modelId } });
    setDraft("");
  };

  return (
    <section aria-label="Chat" data-tour="chat" className="flex min-h-0 w-full flex-col md:w-[420px] md:shrink-0">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          {initialMessages.length === 0 && runs.length === 0 ? (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Hi! I&apos;m Architect.</p>
              <p className="mt-1 text-muted-foreground">
                {projectDescription
                  ? `Let's build: “${projectDescription}”. Who will use it?`
                  : "Describe the agent you want and I'll plan it with you."}
              </p>
            </div>
          ) : null}

          {initialMessages.map((m) => (
            <MessageView key={m.id} message={m} />
          ))}
          {runs.map((run) => (
            <RunView key={run.id} run={run} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form onSubmit={onSubmit} className="border-t p-3">
        {running > 0 ? (
          <p className="mb-2 text-xs text-muted-foreground">
            {running} prompt{running > 1 ? "s" : ""} running. You can keep sending; each runs in parallel.
          </p>
        ) : null}
        <div data-tour="chat-input" className="border bg-card p-1.5 focus-within:ring-2 focus-within:ring-ring/50">
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
            <span className="text-xs text-muted-foreground">{findModel(modelId)?.label ?? modelId}</span>
            <Button type="submit" size="icon" className="size-7" aria-label="Send" disabled={!draft.trim()}>
              <ArrowUpIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

function RunView({ run }: { run: Run }) {
  const { messages, status, error, stop } = useChat<ArchitectUIMessage>({ chat: run.chat });
  const own = messages.slice(run.contextLength);
  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="space-y-4">
      {own.map((m) => (
        <MessageView key={m.id} message={m} />
      ))}
      {busy ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{status === "submitted" ? "Thinking…" : "Writing…"}</span>
          <button type="button" onClick={() => void stop()} className="inline-flex items-center gap-1 hover:text-foreground">
            <SquareIcon className="size-3" /> Stop this one
          </button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
          {readableError(error)}
        </p>
      ) : null}
    </div>
  );
}

function MessageView({ message }: { message: ArchitectUIMessage }) {
  return (
    <div className={cn("flex flex-col gap-1.5", message.role === "user" && "items-end")}>
      {message.parts.map((part, i) => {
        switch (part.type) {
          case "text":
            return message.role === "user" ? (
              <div key={i} className="max-w-[90%] border bg-card px-3 py-2 text-sm">
                <span className="label-mono block text-muted-foreground">You</span>
                <span className="whitespace-pre-wrap">{part.text}</span>
              </div>
            ) : (
              <div key={i} className="max-w-[95%] text-sm">
                <span className="label-mono block text-primary">Architect</span>
                <Markdown text={part.text} />
              </div>
            );
          case "data-memory":
            return <MemoryRecall key={i} data={part.data} />;
          case "data-usage":
            return <UsageLine key={i} data={part.data} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

/** Route errors arrive as the response body text; show the server's message, not raw JSON. */
function readableError(err: Error): string {
  try {
    const body: unknown = JSON.parse(err.message);
    if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // not JSON
  }
  return err.message || "Something went wrong.";
}
