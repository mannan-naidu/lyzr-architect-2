// Client-safe types for the build loop's wire formats.

export type WorkspaceFile = { path: string; content: string };

export type BuildUsage = { modelId: string; inputTokens: number; outputTokens: number };

/** NDJSON events streamed by POST /api/projects/[id]/build. */
export type BuildEvent =
  | { type: "status"; message: string }
  | { type: "recall"; memories: string[] }
  | { type: "file-start"; path: string }
  | { type: "done"; files: WorkspaceFile[]; notes: string; usage: BuildUsage }
  | { type: "error"; message: string };

/** Response of POST /api/projects/[id]/fix. */
export type FixResponse =
  | {
      status: "fixed";
      signature: string;
      attempt: number;
      diagnosis: string;
      summary: string;
      /** A fix that worked before for the same error (this or another project). */
      knownFix: { summary: string; when: string } | null;
      /** The model's own judgement: did the known fix apply after diagnosing? */
      usedKnownFix: boolean;
      /** Approaches already tried for this error that failed; the fix avoided them. */
      avoided: string[];
      files: WorkspaceFile[];
      usage: BuildUsage;
    }
  | {
      status: "loop_broken";
      signature: string;
      attempts: number;
      question: string;
      files: WorkspaceFile[];
    };
