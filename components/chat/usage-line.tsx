import { findModel } from "@/lib/models";
import type { UsagePartData } from "@/lib/memory/types";

const usd = new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 4 });

/** Fair-billing ledger, per turn: tokens, cost, and who pays. */
export function UsageLine({ data }: { data: UsagePartData }) {
  const label = findModel(data.modelId)?.label ?? data.modelId;
  const tokens = (data.inputTokens + data.outputTokens).toLocaleString();
  return (
    <p className="text-xs text-muted-foreground">
      {label} · {tokens} tokens
      {data.costUsd !== null ? ` · ${usd.format(data.costUsd)}` : ""}
      {data.billedTo === "agent-self-fix" ? " · self-fix (free)" : ""}
    </p>
  );
}
