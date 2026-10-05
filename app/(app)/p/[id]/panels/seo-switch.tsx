"use client";

import { SearchIcon } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { SwitchToggle } from "@/components/switch-toggle";

import { setProjectFlags } from "../actions";
import { useWorkspace } from "../workspace-context";

/**
 * The SEO + GEO switch. It lives at the start of the flow (new project, Plan) because it changes
 * how the app is built: static-first, content-in-HTML. Ship only shows the resulting report.
 */
export function SeoSwitch() {
  const { project, files } = useWorkspace();
  const [on, setOn] = useOptimistic(project.seo_enabled);
  const [, start] = useTransition();

  const toggle = (next: boolean) =>
    start(async () => {
      setOn(next);
      const result = await setProjectFlags({ projectId: project.id, seo_enabled: next });
      if ("error" in result) toast.error(result.error);
      else if (files.length)
        toast.info(next ? "SEO + GEO on: rebuild to make the page static-first" : "SEO + GEO off", {
          description: next ? "The next build renders all content as HTML; deploys ship a pre-rendered page." : undefined,
        });
    });

  return (
    <div className="flex items-start gap-3 border bg-card p-3">
      <SearchIcon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Public website: optimise for search and AI answers (SEO + GEO)</p>
        <p className="text-xs text-muted-foreground">
          Builds static-first: every word of content is real HTML on first load, then deploys a pre-rendered page with
          meta tags, sitemap, JSON-LD and llms.txt. You get the report in Ship. Leave it off for internal tools.
        </p>
      </div>
      <SwitchToggle checked={on} onCheckedChange={toggle} label="SEO and GEO optimisation" />
    </div>
  );
}
