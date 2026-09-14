import { Children, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vite-plus/test";
import { blankResume } from "../src/data/blankResume.ts";
import { ClassicImpact } from "../src/templates/ClassicImpact.tsx";
import { CompactTimeline } from "../src/templates/CompactTimeline.tsx";
import { Ledger } from "../src/templates/Ledger.tsx";
import { TEMPLATE_LIST } from "../src/templates/index.ts";
import { TEMPLATE_COUNT } from "../src/templates/meta.ts";
import type { ResumeData } from "../src/types.ts";
import { derivePalette } from "../src/utils/colors.ts";

// These tests verify template content and the atoms supplied to pagination. The
// browser audit exercises real measurements and PDF output on both paper sizes.
vi.mock("../src/components/PaginatedCanvas.tsx", () => ({
  PaginatedCanvas: ({
    children,
    sidebarAtoms,
  }: {
    children: ReactNode;
    sidebarAtoms?: ReactNode[];
  }) => (
    <div>
      <aside>{sidebarAtoms}</aside>
      <main>
        {Children.map(children, (child) => (
          <section data-atom="true">{child}</section>
        ))}
      </main>
    </div>
  ),
}));

const palette = derivePalette("#047857");
const fixture: ResumeData = {
  ...blankResume,
  profile: { name: "Maya Chen", title: "Operations Director", summary: "Summary evidence." },
  contact: [{ id: "c", kind: "email", value: "maya@example.com" }],
  experience: [
    {
      id: "e",
      title: "Director of Operations",
      company: "Example Company",
      location: "Berlin",
      start: "Jan 2020",
      end: "Present",
      bullets: ["First experience evidence.", "Second experience evidence."],
    },
  ],
  education: [
    {
      id: "ed",
      degree: "MBA",
      school: "Example University",
      location: "London",
      start: "2017",
      end: "2019",
      detail: "Education evidence.",
    },
  ],
  skills: [{ id: "s", label: "Strategy", items: "Planning, Forecasting" }],
  projects: [
    {
      id: "p",
      name: "Growth Programme",
      description: "Project description evidence.",
      roles: ["Project role evidence."],
      stack: ["Project tool"],
    },
  ],
  certifications: [
    {
      id: "cert",
      name: "Example Qualification",
      issuer: "Certifying Board",
      year: "2022",
      url: "https://example.com/credential",
    },
  ],
  awards: [{ id: "a", title: "Leadership Award", year: "2024", detail: "Award evidence." }],
  languages: [{ id: "l", name: "English", level: "Fluent" }],
  interests: ["Sailing"],
  interestsLabel: "Outside Work",
  tools: ["Analysis Suite"],
  toolsLabel: "Toolbox",
  extras: [{ id: "x", label: "Availability", value: "One month" }],
  custom: [{ id: "cu", header: "Volunteering", bullets: ["Custom section evidence."] }],
};

function stats(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `q-${i}`,
    value: `${i + 1}+`,
    label: `Result ${i + 1}`,
  }));
}

for (const [name, Component, prefix] of [
  ["Classic Impact", ClassicImpact, "ci"],
  ["Ledger", Ledger, "ld"],
] as const) {
  describe(name, () => {
    it.each([0, 1, 3, 4, 5, 8, 9, 17])(
      "keeps %i stats in rows of at most four after the summary",
      (count) => {
        const html = renderToStaticMarkup(
          <Component resume={{ ...fixture, quickStats: stats(count) }} palette={palette} />,
        );
        const aside = html.match(/<aside>([\s\S]*?)<\/aside>/)?.[1] ?? "";
        const main = html.match(/<main>([\s\S]*?)<\/main>/)?.[1] ?? "";
        const rows = [
          ...main.matchAll(
            /<section data-atom="true">(<div class="(?:ci|ld)-stats-row"[\s\S]*?)<\/section>/g,
          ),
        ];
        expect(rows).toHaveLength(Math.ceil(count / 4));
        expect(aside).not.toContain(`class="${prefix}-stat"`);
        rows.forEach((row, index) => {
          expect(row[1].match(new RegExp(`class="${prefix}-stat"`, "g")) ?? []).toHaveLength(
            Math.min(4, count - index * 4),
          );
        });
        if (count > 0) {
          expect(main.indexOf("Summary evidence.")).toBeLessThan(main.indexOf("Quick Stats"));
          expect(main.indexOf("Quick Stats")).toBeLessThan(main.indexOf("Work Experience"));
          for (const stat of stats(count)) {
            expect(html.split(`>${stat.label}<`)).toHaveLength(2);
          }
        } else {
          expect(main).not.toContain("Quick Stats");
        }
      },
    );

    it("renders every populated section, custom headings, and credential/contact links", () => {
      const html = renderToStaticMarkup(<Component resume={fixture} palette={palette} />);
      for (const text of [
        "Maya Chen",
        "Operations Director",
        "Summary evidence.",
        "Director of Operations",
        "Example Company",
        "Jan 2020 – Present",
        "First experience evidence.",
        "Second experience evidence.",
        "MBA",
        "Example University",
        "Education evidence.",
        "Strategy",
        "Planning, Forecasting",
        "Growth Programme",
        "Project description evidence.",
        "Project role evidence.",
        "Project tool",
        "Example Qualification",
        "Certifying Board",
        "Leadership Award",
        "Award evidence.",
        "English",
        "Fluent",
        "Outside Work",
        "Sailing",
        "Toolbox",
        "Analysis Suite",
        "Availability",
        "One month",
        "Volunteering",
        "Custom section evidence.",
      ]) {
        expect(html, text).toContain(text);
      }
      expect(html).toContain('href="mailto:maya@example.com"');
      expect(html).toContain('href="https://example.com/credential"');
      expect(html).toContain(`<h1 class="${prefix}-name">Maya Chen</h1>`);
    });

    it("keeps experience and project paragraphs separate for safe page breaks", () => {
      const html = renderToStaticMarkup(<Component resume={fixture} palette={palette} />);
      const atoms = [...html.matchAll(/<section data-atom="true">([\s\S]*?)<\/section>/g)].map(
        (match) => match[1],
      );
      for (const [first, second] of [
        ["First experience evidence.", "Second experience evidence."],
        ["Project description evidence.", "Project role evidence."],
      ]) {
        const firstAtom = atoms.findIndex((atom) => atom.includes(first));
        const secondAtom = atoms.findIndex((atom) => atom.includes(second));
        expect(firstAtom).toBeGreaterThanOrEqual(0);
        expect(secondAtom).toBe(firstAtom + 1);
      }
    });

    it("omits empty section headings and still supports stats without a summary", () => {
      const empty = renderToStaticMarkup(<Component resume={blankResume} palette={palette} />);
      expect(empty).not.toContain("<h2");
      const withStats = renderToStaticMarkup(
        <Component resume={{ ...blankResume, quickStats: stats(5) }} palette={palette} />,
      );
      expect(withStats).toContain("Quick Stats");
      expect(withStats).not.toContain("Professional Summary");
      expect(withStats.match(/data-stat-row="true"/g)).toHaveLength(2);
    });
  });
}

it("keeps public template metadata synchronized with the lazy registry", () => {
  expect(TEMPLATE_LIST).toHaveLength(TEMPLATE_COUNT);
  expect(TEMPLATE_LIST.map((template) => template.id)).toContain("classic-impact");
  expect(TEMPLATE_LIST.map((template) => template.id)).toContain("ledger");
});

it("preserves education locations in Compact Timeline", () => {
  const resume = {
    ...fixture,
    education: [{ ...fixture.education[0], location: "Reykjavik, Iceland" }],
  };
  const html = renderToStaticMarkup(<CompactTimeline resume={resume} palette={palette} />);
  expect(html).toContain("Example University, Reykjavik, Iceland");
});
