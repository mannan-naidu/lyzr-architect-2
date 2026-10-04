import type { UIMessage } from "ai";

import type { MemoryPartData, UsagePartData } from "@/lib/memory/types";

/** The chat's UIMessage shape: text plus our `data-memory` and `data-usage` parts. */
export type ArchitectUIMessage = UIMessage<
  never,
  {
    memory: MemoryPartData;
    usage: UsagePartData;
  }
>;
