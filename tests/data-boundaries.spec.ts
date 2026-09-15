import { describe, expect, it } from "vite-plus/test";
import { blankResume, resumeHasContent } from "../src/data/blankResume.ts";
import { normalizeResumeData, readResumeFile } from "../src/utils/fileIO.ts";
import { computeAts } from "../src/utils/ats.ts";
import { derivePalette, normalizePrimaryColor, PRESET_COLORS } from "../src/utils/colors.ts";
import { formatDateRange } from "../src/templates/shared.tsx";
import { plainText } from "../src/utils/richText.tsx";
import { isValidPhone } from "../src/utils/validation.ts";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { AtsKeywordsPane } from "../src/components/ats/AtsKeywordsPane.tsx";
import { AtsParsePreview } from "../src/components/ats/AtsParsePreview.tsx";
import { AtsOverviewPane } from "../src/components/ats/AtsOverviewPane.tsx";

describe("saved document boundaries", () => {
  it("keeps photo, logo, and custom-label drafts available to resume", () => {
    expect(resumeHasContent(blankResume)).toBe(false);
    expect(
      resumeHasContent({
        ...blankResume,
        profile: { ...blankResume.profile, photoUrl: "data:image/png;base64,aGVsbG8=" },
      }),
    ).toBe(true);
    expect(
      resumeHasContent({
        ...blankResume,
        profile: { ...blankResume.profile, logoIconName: "Code" },
      }),
    ).toBe(true);
    expect(resumeHasContent({ ...blankResume, toolsLabel: "Software" })).toBe(true);
  });
  it("recovers usable text from malformed nested data without exposing invalid values", () => {
    const input = {
      profile: { name: null, summary: 42, photoUrl: "https://example.com/tracking.png" },
      experience: [
        null,
        "bad",
        { id: "same", title: "Engineer", start: 2020, bullets: ["Keep this", null, {}] },
        { id: "same" },
        {},
      ],
      projects: [
        { name: "Legacy", role: "First line\nSecond line" },
        { roles: [null, "Good"], stack: {} },
      ],
      skills: [{}],
      education: [{}],
      awards: [{}],
      languages: [{}],
      certifications: [{}],
      custom: [{ header: "Work", bullets: false }],
      quickStats: [{ value: 12 }],
      extras: [{}],
      tools: [null, "Git", {}],
      contact: [{ kind: "invalid", value: "Keep me" }],
    };
    const result = normalizeResumeData(input);
    expect(result.profile.name).toBe(blankResume.profile.name);
    expect(result.profile.summary).toBe("42");
    expect(result.profile.photoUrl).toBeUndefined();
    expect(result.experience).toHaveLength(3);
    expect(new Set(result.experience.map((row) => row.id)).size).toBe(3);
    expect(result.experience[0].start).toBe("2020");
    expect(result.experience[0].bullets).toEqual(["Keep this"]);
    expect(result.projects[0].roles).toEqual(["First line\nSecond line"]);
    expect(result.projects[1].roles).toEqual(["Good"]);
    expect(result.tools).toEqual(["Git"]);
    expect(result.contact[0].kind).toBe("other");
    expect(normalizeResumeData(input)).toEqual(result);
    expect(() => computeAts(result)).not.toThrow();
  });

  it.each([null, [], false, 12, "text"])(
    "normalizes an invalid root %j to an independent blank draft",
    (input) => {
      const result = normalizeResumeData(input);
      expect(result).toEqual(blankResume);
      expect(result).not.toBe(blankResume);
    },
  );

  it("rejects array-shaped resume files", async () => {
    const file = new File(
      [JSON.stringify({ kind: "cloakresume.v1", resume: [], templateId: "ats-plain" })],
      "bad.json",
    );
    await expect(readResumeFile(file)).rejects.toThrow("missing resume data");
  });

  it("normalizes imported theme values before they reach template CSS", async () => {
    const file = new File(
      [
        JSON.stringify({
          kind: "cloakresume.v1",
          resume: blankResume,
          templateId: "ats-plain",
          primary: "red; display:none",
          paperSize: "unknown",
        }),
      ],
      "theme.json",
    );
    expect(await readResumeFile(file)).toMatchObject({ primary: "#047857", paperSize: "a4" });
    expect(normalizePrimaryColor("#abc")).toBe("#aabbcc");
  });
});

describe("analysis and validation", () => {
  it("keeps ATS scoring and keywords unchanged when body text is underlined", () => {
    const resume = {
      ...blankResume,
      profile: {
        ...blankResume.profile,
        summary:
          "Built reliable platforms with Kubernetes and TypeScript to help engineering teams deliver better services.",
      },
      experience: [
        {
          id: "role",
          title: "Engineer",
          company: "Company",
          location: "Remote",
          start: "2020",
          end: "Present",
          bullets: [
            "Delivered reliable tools for 20 engineers and improved platform speed by 30%.",
          ],
        },
      ],
    };
    const formatted = {
      ...resume,
      profile: { ...resume.profile, summary: `<u>${resume.profile.summary}</u>` },
      experience: resume.experience.map((job) => ({
        ...job,
        bullets: job.bullets.map((bullet) => `<u>${bullet}</u>`),
      })),
    };
    expect(computeAts(formatted, "Kubernetes TypeScript")).toEqual(
      computeAts(resume, "Kubernetes TypeScript"),
    );
  });

  it("matches keywords in custom sections, quick stats, and extras", () => {
    const resume = {
      ...blankResume,
      custom: [{ id: "c", header: "Volunteering", bullets: ["Mentoring"] }],
      quickStats: [{ id: "q", label: "Retention", value: "80%" }],
      extras: [{ id: "e", label: "Platform", value: "Kubernetes" }],
    };
    expect(computeAts(resume, "Mentoring retention Kubernetes").keywords).toEqual({
      matched: ["mentoring", "retention", "kubernetes"],
      missing: [],
    });
  });

  it("counts keyword occurrences in custom sections, stats, and extras consistently", () => {
    const resume = {
      ...blankResume,
      custom: [{ id: "c", header: "Mentoring", bullets: ["Mentoring mentoring"] }],
    };
    const html = renderToStaticMarkup(
      createElement(AtsKeywordsPane, {
        resume,
        report: computeAts(resume, "Mentoring"),
        hasJobDescription: true,
        onOpenJdEditor: () => {},
      }),
    );
    expect(html).toContain("×3");
  });

  it("includes every prose section in the document text preview without Markdown markers", () => {
    const resume = normalizeResumeData({
      profile: { summary: "**Summary sentence**" },
      contact: [{ kind: "website", value: "portfolio.example.com" }],
      experience: [{ bullets: ["**Experience achievement**"] }],
      education: [{ detail: "Research fellowship" }],
      projects: [{ description: "Project description", roles: ["Project contribution"] }],
      certifications: [{ name: "Certificate name", url: "verify.example.com" }],
      awards: [{ title: "Award name", detail: "Recognition details" }],
      languages: [{ name: "French", level: "Advanced" }],
      interestsLabel: "Outside work",
      interests: ["Running"],
      tools: ["Editor"],
      quickStats: [{ value: "20", label: "Teams mentored" }],
      extras: [{ label: "Availability", value: "Immediately" }],
      custom: [{ header: "Community", bullets: ["Mentoring students"] }],
    });
    const html = renderToStaticMarkup(createElement(AtsParsePreview, { resume }));
    for (const text of [
      "Summary sentence",
      "portfolio.example.com",
      "Experience achievement",
      "Research fellowship",
      "Project description",
      "Project contribution",
      "Certificate name",
      "verify.example.com",
      "Award name",
      "Recognition details",
      "French: Advanced",
      "OUTSIDE WORK",
      "Running",
      "Editor",
      "20 Teams mentored",
      "Availability: Immediately",
      "Community",
      "Mentoring students",
    ])
      expect(html).toContain(text);
    expect(html).not.toContain("**");
    expect(html).toContain("actual ATS results may differ");
  });

  it("distinguishes a completed short writing scan from a pending scan", () => {
    const report = computeAts(blankResume, "", { wordsChecked: 3, issues: [] });
    expect(report.writingReady).toBe(false);
    const html = renderToStaticMarkup(
      createElement(AtsOverviewPane, { report, hasJobDescription: false }),
    );
    expect(html).toContain("3 words checked");
    expect(html).toContain("Add at least 20 words");
    expect(html).not.toContain("waiting for scan");
  });

  it.each(["(415) 555-0123", "+91 98765 43210", "415-555-0123"])(
    "accepts common phone formatting: %s",
    (value) => {
      expect(isValidPhone(value)).toBe(true);
    },
  );
});

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((channel) => parseInt(channel, 16) / 255);
  const [r, g, b] = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

describe("template text and dates", () => {
  it.each([
    ...PRESET_COLORS.map((color) => color.value),
    "#777777",
    "#7a7a7a",
    "#ffffff",
    "#000000",
  ])("keeps primary-background text readable on %s", (color) => {
    const palette = derivePalette(color);
    const a = luminance(palette.primary);
    const b = luminance(palette.primaryText);
    expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ["", "Present", "Present"],
    ["2020", "", "2020"],
    ["", "", ""],
    ["2020", "2025", "2020 – 2025"],
  ])("formats partial dates %j / %j", (start, end, expected) => {
    expect(formatDateRange(start, end)).toBe(expected);
  });

  it("preserves identifiers and applies the same formatting rules to analysis text", () => {
    expect(plainText("event_source_id and customer_account_key")).toBe(
      "event_source_id and customer_account_key",
    );
    expect(plainText("__Bold__\n_Italic_ and **strong** `code_id`")).toBe(
      "Bold\nItalic and strong code_id",
    );
  });
});
