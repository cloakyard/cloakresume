import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { AtsInsightsPane } from "../src/components/ats/AtsInsightsPane.tsx";
import { AtsKeywordsPane } from "../src/components/ats/AtsKeywordsPane.tsx";
import { AtsOverviewPane } from "../src/components/ats/AtsOverviewPane.tsx";
import { AtsParsePreview } from "../src/components/ats/AtsParsePreview.tsx";
import { blankResume } from "../src/data/blankResume.ts";
import { computeAts } from "../src/utils/ats.ts";

const draft = {
  ...blankResume,
  profile: {
    ...blankResume.profile,
    name: "Review fixture",
    summary: "Built **TypeScript** tools with TypeScript.",
  },
};
const report = computeAts(draft, "TypeScript Kubernetes");

describe("review report fidelity", () => {
  it("retains repeated findings, complete phrases and field context while capping the visible list", () => {
    const issue = {
      segmentId: "profile.summary",
      segmentLabel:
        "A complete field label with enough context to identify the source when several sections have similar titles",
      kind: "style" as const,
      actual:
        "A phrase requiring review that is deliberately longer than the retired seventy two character truncation limit",
      suggestions: ["A concise replacement", "An alternative"],
      reason: "The complete reason remains available before jumping to the source field.",
    };
    const html = renderToStaticMarkup(
      <AtsInsightsPane
        report={{
          ...report,
          grammar: { issues: Array.from({ length: 27 }, () => issue), wordsChecked: 100 },
        }}
        onJumpToField={() => {}}
      />,
    );
    expect(html.match(/aria-label="Jump to /g)).toHaveLength(25);
    expect(html).toContain("27 findings");
    expect(html).toContain("+2 more");
    expect(html).toContain(issue.actual);
    expect(html).toContain(issue.segmentLabel);
    expect(html).toContain(issue.reason);
    expect(html).toContain("A concise replacement");
    expect(html).toContain("An alternative");
    const descriptions = [...html.matchAll(/aria-describedby="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(descriptions).size).toBe(25);
    for (const id of descriptions) expect(html).toContain(`id="${id}"`);
  });

  it("preserves keyword match counts and distinguishes an absent JD from one without keywords", () => {
    const render = (hasJobDescription: boolean, keywords = report.keywords) =>
      renderToStaticMarkup(
        <AtsKeywordsPane
          report={{ ...report, keywords }}
          resume={draft}
          hasJobDescription={hasJobDescription}
          onOpenJdEditor={() => {}}
        />,
      );
    const html = render(true);
    expect(html).toContain("1 of 2 matched");
    expect(html).toContain("×2");
    expect(html).toContain("kubernetes");
    expect(html).toContain("Absent");
    expect(render(false)).toContain("Open JD editor");
    expect(render(true, { matched: [], missing: [] })).toContain("No reviewable keywords");
  });

  it("renders all-clear and no-insights states without inventing fixes", () => {
    const clear = { ...report, issues: [], wins: [] };
    const overview = renderToStaticMarkup(
      <AtsOverviewPane report={clear} hasJobDescription={false} />,
    );
    expect(overview).toContain("All clear");
    expect(overview).not.toContain("Top fixes");
    expect(renderToStaticMarkup(<AtsInsightsPane report={clear} />)).toContain("No insights yet");
  });

  it("retains plain-text parsing of rich text and every auxiliary section", () => {
    const html = renderToStaticMarkup(
      <AtsParsePreview
        resume={{
          ...draft,
          quickStats: [{ id: "stat", value: "12", label: "projects" }],
          extras: [{ id: "extra", label: "Availability", value: "Immediately" }],
          custom: [{ id: "custom", header: "Volunteering", bullets: ["Built **useful** tools."] }],
          interests: ["Cycling"],
          tools: ["Git"],
        }}
      />,
    );
    for (const text of [
      "Built TypeScript tools with TypeScript.",
      "12 projects",
      "Availability",
      "Immediately",
      "Volunteering",
      "Built useful tools.",
      "Cycling",
      "Git",
    ])
      expect(html).toContain(text);
    expect(html).not.toContain("**");
  });
});
