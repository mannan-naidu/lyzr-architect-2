"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

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

export function ChatPanel({ projectId, projectDescription, modelId, initialMessages }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop } = useChat<ArchitectUIMessage>({
    id: projectId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: `/api/projects/${projectId}/chat` }),
    onError: (err) => setError(readableError(err)),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setError(null);
    // The model is sent per message, so switching models mid-chat just works.
    void sendMessage({ text }, { body: { modelId } });
    setDraft("");
  };

  return (
    <section aria-label="Chat" className="flex min-h-0 w-full flex-col md:w-[420px] md:shrink-0">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Hi! I&apos;m Architect.</p>
              <p className="mt-1 text-muted-foreground">
                {projectDescription
                  ? `Let's build: “${projectDescription}”. Who will use it?`
                  : "Describe the agent you want and I'll plan it with you."}
              </p>
            </div>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex flex-col gap-1.5", message.role === "user" && "items-end")}
            >
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return (
                      <div
                        key={i}
                        className={cn(
                          "max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        {part.text}
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
          ))}

          {status === "submitted" ? <p className="text-xs text-muted-foreground">Thinking…</p> : null}
          {error ? (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div ref={bottomRef} />
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
            <span className="text-xs text-muted-foreground">{findModel(modelId)?.label ?? modelId}</span>
            {busy ? (
              <Button type="button" size="icon" variant="secondary" className="size-7" aria-label="Stop" onClick={() => void stop()}>
                <SquareIcon className="size-3" />
              </Button>
            ) : (
              <Button type="submit" size="icon" className="size-7" aria-label="Send" disabled={!draft.trim()}>
                <ArrowUpIcon className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </section>
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
