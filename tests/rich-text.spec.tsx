/// <reference types="vite/client" />

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { blankResume } from "../src/data/blankResume.ts";
import type { TemplateProps } from "../src/templates/index.ts";
import { derivePalette } from "../src/utils/colors.ts";
import { normalizeResumeData } from "../src/utils/fileIO.ts";
import { RichText, toggleSelection, formatStateAt, plainText } from "../src/utils/richText.tsx";
import type { ComponentType } from "react";

function renderText(value: string) {
  return renderToStaticMarkup(<RichText value={value} />);
}

function visibleText(html: string) {
  return html.replace(/<br\s*\/?\s*>/g, "\n").replace(/<[^>]*>/g, "");
}

describe("resume body text", () => {
  it("renders underline with nested formatting and removes only supported markup from analysis", () => {
    const value = "<u>**Bold** and *italic* with `code`</u> and C++";
    const html = renderText(value);
    expect(html).toContain("text-decoration-line:underline");
    expect(html).toContain("<strong>");
    expect(html).toContain("<em>");
    expect(visibleText(html)).toBe("Bold and italic with code and C++");
    expect(plainText(value)).toBe("Bold and italic with code and C++");
    expect(renderText('<u onclick="alert(1)">literal</u>')).not.toContain("<u ");
    expect(renderText("<u>unfinished")).toContain("&lt;u&gt;");
    expect(plainText("`<u>literal</u>`")).toBe("<u>literal</u>");
  });
  it.each(["\n", "\r\n", "\r"])("preserves paragraphs with %j line endings", (newline) => {
    const value = ["First line", "Second line", "", "Fourth line"].join(newline);
    expect(visibleText(renderText(value))).toBe("First line\nSecond line\n\nFourth line");
  });

  it("preserves leading and trailing blank lines and entered spacing", () => {
    const value = "\n  Indented  text\twith a tab\n\n";
    const html = renderText(value);
    expect(visibleText(html)).toBe(value);
    expect(html).toContain("white-space:pre-wrap");
    expect(html).not.toContain("overflow-wrap:anywhere");
  });

  it("keeps inline formatting on separate lines", () => {
    const html = renderText("**Bold**\n*Italic*\n`Code`\n__Also bold__\n_Also italic_");
    expect(visibleText(html)).toBe("Bold\nItalic\nCode\nAlso bold\nAlso italic");
    expect(html.match(/<strong>/g)).toHaveLength(2);
    expect(html.match(/<em>/g)).toHaveLength(2);
    expect(html).toContain("<code ");
  });

  it("keeps HTML input as text and incomplete formatting markers visible", () => {
    const html = renderText('<script>alert("test")</script>\n**unfinished');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(visibleText(html)).toContain("\n**unfinished");
    expect(renderText("")).toBe("");
  });
});

describe("formatting a text selection", () => {
  it("toggles underline around selections and at a caret with accurate active state", () => {
    const result = toggleSelection(
      { value: "Before text after", selectionStart: 7, selectionEnd: 11 },
      "<u>",
    );
    expect(result).toEqual({ value: "Before <u>text</u> after", start: 10, end: 14 });
    expect(
      toggleSelection(
        { value: result.value, selectionStart: result.start, selectionEnd: result.end },
        "<u>",
      ),
    ).toEqual({ value: "Before text after", start: 7, end: 11 });
    expect(
      toggleSelection({ value: "<u>text</u>", selectionStart: 5, selectionEnd: 5 }, "<u>"),
    ).toEqual({ value: "text", start: 2, end: 2 });
    expect(formatStateAt("<u>text</u>", 5)).toMatchObject({ underline: true, code: false });
    expect(formatStateAt("<u>text</u>", 11)).toMatchObject({ underline: false });
    expect(formatStateAt("`<u>text</u>`", 6)).toMatchObject({ underline: false, code: true });
  });

  it.each(["**", "*", "`", "__", "_", "<u>"])(
    "applies and removes %s across lines without eating blank lines or indentation",
    (marker) => {
      const value = "  First line\n\nSecond line  \n";
      const formatted = toggleSelection(
        { value, selectionStart: 0, selectionEnd: value.length },
        marker,
      );
      expect(formatted.value).toBe(
        `  ${marker}First line${marker === "<u>" ? "</u>" : marker}\n\n${marker}Second line${marker === "<u>" ? "</u>" : marker}  \n`,
      );
      expect(visibleText(renderText(formatted.value))).toBe(value);
      const restored = toggleSelection(
        { value: formatted.value, selectionStart: formatted.start, selectionEnd: formatted.end },
        marker,
      );
      expect(restored).toEqual({ value, start: 0, end: value.length });
    },
  );

  it("formats a selection across partial lines without changing surrounding text", () => {
    const value = "Before first\nsecond after";
    const result = toggleSelection({ value, selectionStart: 7, selectionEnd: 19 }, "**");
    expect(result.value).toBe("Before **first**\n**second** after");
    expect(visibleText(renderText(result.value))).toBe(value);
  });

  it("does not insert placeholder text into blank selected lines", () => {
    const value = "\n  \n\t\n";
    expect(toggleSelection({ value, selectionStart: 0, selectionEnd: value.length }, "**")).toEqual(
      {
        value,
        start: 0,
        end: value.length,
      },
    );
  });

  it("retains single-line selection and cursor toggle behavior", () => {
    const result = toggleSelection(
      { value: "Before text after", selectionStart: 7, selectionEnd: 11 },
      "**",
    );
    expect(result).toEqual({ value: "Before **text** after", start: 9, end: 13 });
    expect(
      toggleSelection(
        { value: result.value, selectionStart: result.start, selectionEnd: result.end },
        "**",
      ),
    ).toEqual({ value: "Before text after", start: 7, end: 11 });
    expect(
      toggleSelection({ value: "**text**", selectionStart: 4, selectionEnd: 4 }, "**"),
    ).toEqual({ value: "text", start: 2, end: 2 });
  });
});

const multilineResume = {
  ...blankResume,
  profile: { ...blankResume.profile, summary: "Summary first\n\nSummary second" },
  experience: [
    {
      id: "job",
      title: "Engineer",
      company: "Company",
      location: "",
      start: "",
      end: "",
      bullets: ["Experience first\nExperience second"],
    },
  ],
  projects: [
    {
      id: "project",
      name: "Project",
      description: "Description first\nDescription second",
      roles: ["Role first\nRole second"],
      stack: [],
    },
  ],
  custom: [
    { id: "paragraph", header: "Paragraph", bullets: ["Paragraph first\n\nParagraph second"] },
    { id: "list", header: "List", bullets: ["Custom first\nCustom second", "Another bullet"] },
  ],
};

// Discover real templates so additions receive the same regression coverage.
const modules = import.meta.glob<Record<string, ComponentType<TemplateProps>>>(
  "../src/templates/[A-Z]*.tsx",
  { eager: true },
);

describe("multiline text throughout the resume", () => {
  it("survives saving and loading without losing paragraph boundaries", () => {
    expect(normalizeResumeData(JSON.parse(JSON.stringify(multilineResume)))).toEqual({
      ...multilineResume,
      interestsLabel: undefined,
      toolsLabel: undefined,
    });
  });

  it.each(Object.entries(modules))("preserves each editable body field in %s", (path, module) => {
    const name = path.slice(path.lastIndexOf("/") + 1, -4);
    const Template = module[name];
    const html = renderToStaticMarkup(
      <Template resume={multilineResume} palette={derivePalette("#047857")} />,
    );
    const text = visibleText(html);
    for (const value of [
      multilineResume.profile.summary,
      ...multilineResume.experience[0].bullets,
      multilineResume.projects[0].description,
      ...multilineResume.projects[0].roles,
      ...multilineResume.custom.flatMap((section) => section.bullets),
    ]) {
      expect(text).toContain(value);
    }
  });
});
