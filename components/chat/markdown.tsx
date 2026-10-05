"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders assistant replies (Markdown) in the ink & paper style. Raw HTML is not rendered. */
export function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="my-1.5 list-disc space-y-1 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="my-1.5 list-decimal space-y-1 pl-5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        h1: ({ children }) => <p className="mt-3 mb-1 font-semibold">{children}</p>,
        h2: ({ children }) => <p className="mt-3 mb-1 font-semibold">{children}</p>,
        h3: ({ children }) => <p className="mt-2 mb-1 font-medium">{children}</p>,
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
            {children}
          </a>
        ),
        code: ({ children, className }) =>
          className ? (
            <code className={className}>{children}</code>
          ) : (
            <code className="bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
          ),
        pre: ({ children }) => <pre className="my-2 overflow-x-auto border bg-muted/40 p-2 font-mono text-xs">{children}</pre>,
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto">
            <table className="w-full border text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border-b px-2 py-1 text-left font-medium">{children}</th>,
        td: ({ children }) => <td className="border-b px-2 py-1">{children}</td>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
