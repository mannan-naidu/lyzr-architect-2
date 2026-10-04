import type { Plan } from "@/lib/build/schemas";
import type { WorkspaceFile } from "@/lib/build/types";

/**
 * SEO + GEO (generative-engine optimisation) for published apps. Client-safe and deterministic:
 * the audit scores what the generated app ships with, and `seoFiles` produces what the toggle
 * adds at deploy time (meta tags, sitemap, robots, llms.txt for AI crawlers, JSON-LD).
 */
export type SeoCheck = { id: string; label: string; ok: boolean; fix: string; geo?: boolean };

export function seoFiles(plan: Plan | null, appName: string, url: string, faqs: { q: string; a: string }[] = []) {
  const title = plan?.title ?? appName;
  const description = (plan?.summary ?? `${appName}, built with Architect.`).slice(0, 158);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebApplication", name: title, description, url, applicationCategory: "BusinessApplication" },
      ...(faqs.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            },
          ]
        : []),
    ],
  };
  return {
    "/head.html": [
      `<title>${title}</title>`,
      `<meta name="description" content="${description.replace(/"/g, "&quot;")}" />`,
      `<link rel="canonical" href="${url}" />`,
      `<meta property="og:title" content="${title}" />`,
      `<meta property="og:description" content="${description.replace(/"/g, "&quot;")}" />`,
      `<meta property="og:url" content="${url}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    ].join("\n"),
    "/robots.txt": `User-agent: *\nAllow: /\n\n# AI crawlers welcome (GEO)\nUser-agent: GPTBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`,
    "/sitemap.xml": `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
      "",
      ...(plan?.screens ?? []).map((s) => s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    ]
      .map((p) => `  <url><loc>${url}/${p}</loc></url>`)
      .join("\n")}\n</urlset>\n`,
    "/llms.txt": `# ${title}\n\n> ${description}\n\n## Who it's for\n${plan?.audience ?? "Everyone"}\n\n## What it does\n${(
      plan?.userStories ?? []
    )
      .map((s) => `- ${s}`)
      .join("\n")}\n\n## Pages\n${(plan?.screens ?? []).map((s) => `- [${s.name}](${url}/${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}): ${s.purpose}`).join("\n")}\n${
      faqs.length ? `\n## FAQ\n${faqs.map((f) => `- **${f.q}** ${f.a}`).join("\n")}\n` : ""
    }`,
  } satisfies Record<string, string>;
}

export function seoAudit(files: WorkspaceFile[], seoEnabled: boolean): { score: number; checks: SeoCheck[] } {
  const code = files.map((f) => f.content).join("\n");
  const has = (re: RegExp) => re.test(code);
  const checks: SeoCheck[] = [
    { id: "title", label: "Page title and meta description", ok: seoEnabled, fix: "Turn on SEO/GEO to generate them from your plan." },
    { id: "h1", label: "One clear <h1> heading", ok: (code.match(/<h1[\s>]/g) ?? []).length === 1, fix: "Use exactly one h1 per page." },
    { id: "alt", label: "Images have alt text", ok: !has(/<img(?![^>]*\balt=)[^>]*>/), fix: "Add alt text to every image." },
    { id: "semantic", label: "Semantic landmarks (header, main, nav)", ok: has(/<main[\s>]/) && (has(/<header[\s>]/) || has(/<nav[\s>]/)), fix: "Wrap content in <main> and add a <header> or <nav>." },
    { id: "links", label: "Descriptive links (no “click here”)", ok: !/click here/i.test(code), fix: "Describe where each link goes." },
    { id: "sitemap", label: "sitemap.xml and robots.txt", ok: seoEnabled, fix: "Generated when SEO/GEO is on." },
    { id: "jsonld", label: "Structured data (JSON-LD)", ok: seoEnabled, fix: "Generated when SEO/GEO is on.", geo: true },
    { id: "llms", label: "llms.txt for AI answer engines", ok: seoEnabled, fix: "Generated when SEO/GEO is on.", geo: true },
    { id: "faq", label: "Question-style headings AI can quote", ok: has(/<h[23][^>]*>[^<]*\?/), fix: "Add an FAQ section with question headings.", geo: true },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { score, checks };
}
