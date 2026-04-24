/**
 * Minimalist template.
 *
 * An elegant, understated single-column layout. Everything is type:
 * generous line-height, a single hairline rule under the name, dash
 * bullets, and no colour blocks or chips. Uses the accent only for the
 * name underline and section markers so it still feels on-brand in
 * print. Different from AtsPlain (which is utilitarian) — this one aims
 * for quiet confidence.
 *
 * Uses the shared `PaginatedCanvas` so long content flows naturally
 * across additional A4 pages at clean section breaks.
 */

import { memo } from "react";
import { PaginatedCanvas } from "../components/PaginatedCanvas.tsx";
import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { RichText } from "../utils/richText.tsx";
import { pushSplitItem } from "./paginationAtoms.tsx";
import {
  certificationLink,
  formatDateRange,
  formatLocation,
  renderContactValue,
  splitSkills,
} from "./shared.tsx";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export const Minimalist = memo(function Minimalist({ resume, palette }: Props) {
  const css = `
    .ml-root { font-family: 'Geist', 'Inter', sans-serif; color: #1a1a1a; font-size: 9.8pt; line-height: 1.6; overflow-wrap: break-word; word-break: break-word; hyphens: auto; }
    .ml-head { margin-bottom: 8mm; }
    .ml-name { font-size: 24pt; font-weight: 500; color: #0a0a0a; letter-spacing: -0.6px; margin: 0; line-height: 1.05; overflow-wrap: break-word; }
    .ml-title { font-size: 10.5pt; color: #525252; margin-top: 2mm; font-weight: 400; letter-spacing: 0.2px; overflow-wrap: break-word; }
    .ml-rule { height: 1px; background: ${palette.primary600}; width: 14mm; margin: 4mm 0 4mm; }
    .ml-contact { font-size: 9pt; color: #525252; letter-spacing: 0.1px; overflow-wrap: anywhere; word-break: break-word; }
    .ml-contact span + span::before { content: " · "; color: #a3a3a3; margin: 0 0.5mm; }
    .ml-h2 { font-size: 8.8pt; text-transform: uppercase; letter-spacing: 2.4px; color: #0a0a0a; font-weight: 600; margin: 6mm 0 3.5mm; break-after: avoid; page-break-after: avoid; }
    .ml-h2::before { content: "§"; color: ${palette.primary600}; font-weight: 400; margin-right: 2mm; letter-spacing: 0; }
    .ml-summary { font-size: 10pt; line-height: 1.7; color: #262626; max-width: 168mm; hyphens: auto; overflow-wrap: break-word; }
    .ml-job { margin-bottom: 4.5mm; page-break-inside: avoid; break-inside: avoid; }
    .ml-job-head { margin-bottom: 0; }
    .ml-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; margin-bottom: 0.5mm; flex-wrap: wrap; }
    .ml-jobtitle { font-size: 10.4pt; font-weight: 600; color: #0a0a0a; min-width: 0; flex: 1 1 auto; overflow-wrap: break-word; }
    .ml-jobmeta { font-size: 9pt; color: #737373; font-variant-numeric: tabular-nums; flex-shrink: 0; }
    .ml-jobco { font-size: 9.6pt; color: #525252; margin-bottom: 1.8mm; font-style: italic; overflow-wrap: break-word; }
    .ml-job ul { list-style: none; padding: 0; margin: 0; }
    .ml-job li { font-size: 9.6pt; line-height: 1.55; padding-left: 4.5mm; position: relative; margin-bottom: 1mm; color: #262626; overflow-wrap: break-word; }
    .ml-job li::before { content: "—"; position: absolute; left: 0; color: #a3a3a3; }
    .ml-ul-bullet { list-style: none; padding: 0; margin: 0; }
    .ml-ul-bullet li { font-size: 9.6pt; line-height: 1.55; padding-left: 4.5mm; position: relative; margin-bottom: 1mm; color: #262626; overflow-wrap: break-word; }
    .ml-ul-bullet li::before { content: "—"; position: absolute; left: 0; color: #a3a3a3; }
    .ml-ul-bullet-first { margin-top: 0; }
    .ml-ul-bullet-last { margin-bottom: 4.5mm; }
    .ml-skill { display: grid; grid-template-columns: 36mm minmax(0, 1fr); gap: 4mm; margin-bottom: 1.4mm; font-size: 9.6pt; page-break-inside: avoid; break-inside: avoid; }
    .ml-skill-label { color: #0a0a0a; font-weight: 600; min-width: 0; overflow-wrap: break-word; }
    .ml-skill-list { color: #262626; min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
    .ml-edu, .ml-proj { margin-bottom: 3mm; page-break-inside: avoid; break-inside: avoid; }
    .ml-edu-head, .ml-proj-head { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; flex-wrap: wrap; }
    .ml-edu-title, .ml-proj-name { font-size: 10pt; font-weight: 600; color: #0a0a0a; min-width: 0; flex: 1 1 auto; overflow-wrap: break-word; }
    .ml-edu-school { font-size: 9.4pt; color: #525252; font-style: italic; overflow-wrap: break-word; }
    .ml-edu-meta, .ml-proj-meta { font-size: 9pt; color: #737373; font-variant-numeric: tabular-nums; flex-shrink: 0; overflow-wrap: break-word; }
    .ml-proj-desc { font-size: 9.4pt; color: #262626; margin-top: 0.8mm; line-height: 1.55; overflow-wrap: break-word; }
    .ml-proj-stack { font-size: 8.8pt; color: #737373; margin-top: 0.8mm; font-style: italic; overflow-wrap: anywhere; }
    .ml-inline { font-size: 9.6pt; color: #262626; overflow-wrap: break-word; }
    .ml-inline strong { color: #0a0a0a; font-weight: 600; overflow-wrap: break-word; }
    .ml-inline span + span::before { content: " · "; color: #a3a3a3; margin: 0 0.5mm; }
  `;

  const atoms: React.ReactNode[] = [];

  atoms.push(
    <header className="ml-head" key="head">
      <h1 className="ml-name">{resume.profile.name}</h1>
      {resume.profile.title && <div className="ml-title">{resume.profile.title}</div>}
      <div className="ml-rule" />
      {resume.contact.length > 0 && (
        <div className="ml-contact">
          {resume.contact.map((c) => (
            <span key={c.id}>{renderContactValue(c)}</span>
          ))}
        </div>
      )}
    </header>,
  );

  if (resume.profile.summary) {
    atoms.push(
      <h2 className="ml-h2" data-keep-with-next="true" key="summary-h">
        About
      </h2>,
      <p className="ml-summary" key="summary-p">
        <RichText value={resume.profile.summary} />
      </p>,
    );
  }

  if (resume.experience.length > 0) {
    atoms.push(
      <h2 className="ml-h2" data-keep-with-next="true" key="exp-h">
        Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      const head = (
        <div className="ml-job ml-job-head" key={`exp-${job.id}-head-inner`}>
          <div className="ml-jobhead">
            <div className="ml-jobtitle">{job.title}</div>
            <div className="ml-jobmeta">{formatDateRange(job.start, job.end)}</div>
          </div>
          <div className="ml-jobco">
            {job.company}
            {formatLocation(job.location)}
          </div>
        </div>
      );
      if (job.bullets.length === 0) {
        atoms.push(
          <div className="ml-job" key={`exp-${job.id}`}>
            <div className="ml-jobhead">
              <div className="ml-jobtitle">{job.title}</div>
              <div className="ml-jobmeta">{formatDateRange(job.start, job.end)}</div>
            </div>
            <div className="ml-jobco">
              {job.company}
              {formatLocation(job.location)}
            </div>
          </div>,
        );
        return;
      }
      pushSplitItem(atoms, {
        keyPrefix: `exp-${job.id}`,
        renderHead: () => head,
        bullets: job.bullets,
        renderBullet: (bullet, i, total) => {
          const cls = [
            "ml-ul-bullet",
            i === 0 ? "ml-ul-bullet-first" : "",
            i === total - 1 ? "ml-ul-bullet-last" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <ul className={cls}>
              <li>
                <RichText value={bullet} />
              </li>
            </ul>
          );
        },
      });
    });
  }

  if (resume.skills.length > 0) {
    atoms.push(
      <h2 className="ml-h2" data-keep-with-next="true" key="skills-h">
        Skills
      </h2>,
    );
    resume.skills.forEach((g) => {
      atoms.push(
        <div className="ml-skill" key={`skills-${g.id}`}>
          <div className="ml-skill-label">{g.label}</div>
          <div className="ml-skill-list">{splitSkills(g.items).join(", ")}</div>
        </div>,
      );
    });
  }

  if (resume.projects.length > 0) {
    atoms.push(
      <h2 className="ml-h2" data-keep-with-next="true" key="proj-h">
        Projects
      </h2>,
    );
    resume.projects.forEach((p) => {
      atoms.push(
        <div className="ml-proj" key={`proj-${p.id}`}>
          <div className="ml-proj-head">
            <div className="ml-proj-name">{p.name}</div>
            {p.role && <div className="ml-proj-meta">{p.role}</div>}
          </div>
          {p.description && (
            <div className="ml-proj-desc">
              <RichText value={p.description} />
            </div>
          )}
          {p.stack.length > 0 && <div className="ml-proj-stack">{p.stack.join(" · ")}</div>}
        </div>,
      );
    });
  }

  if (resume.education.length > 0) {
    atoms.push(
      <h2 className="ml-h2" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      atoms.push(
        <div className="ml-edu" key={`edu-${ed.id}`}>
          <div className="ml-edu-head">
            <div className="ml-edu-title">{ed.degree}</div>
            <div className="ml-edu-meta">{formatDateRange(ed.start, ed.end)}</div>
          </div>
          <div className="ml-edu-school">
            {ed.school}
            {formatLocation(ed.location)}
            {ed.detail ? ` · ${ed.detail}` : ""}
          </div>
        </div>,
      );
    });
  }

  if (resume.certifications.length > 0) {
    atoms.push(
      <h2 className="ml-h2" data-keep-with-next="true" key="cert-h">
        Certifications
      </h2>,
      <div className="ml-inline" key="cert-v">
        {resume.certifications.map((c) => (
          <span key={c.id}>
            {certificationLink(c, <strong>{c.name}</strong>)}
            {c.issuer ? ` — ${c.issuer}` : ""}
            {c.year ? ` (${c.year})` : ""}
          </span>
        ))}
      </div>,
    );
  }

  if (resume.awards.length > 0) {
    atoms.push(
      <h2 className="ml-h2" data-keep-with-next="true" key="award-h">
        Awards
      </h2>,
      <div className="ml-inline" key="award-v">
        {resume.awards.map((a) => (
          <span key={a.id}>
            <strong>{a.title}</strong>
            {a.year ? ` (${a.year})` : ""}
            {a.detail ? ` — ${a.detail}` : ""}
          </span>
        ))}
      </div>,
    );
  }

  if (resume.languages.length > 0) {
    atoms.push(
      <h2 className="ml-h2" data-keep-with-next="true" key="lang-h">
        Languages
      </h2>,
      <div className="ml-inline" key="lang-v">
        {resume.languages.map((l) => (
          <span key={l.id}>
            <strong>{l.name}</strong>
            {l.level ? ` — ${l.level}` : ""}
          </span>
        ))}
      </div>,
    );
  }

  if (resume.tools.length > 0) {
    atoms.push(
      <h2 className="ml-h2" data-keep-with-next="true" key="tools-h">
        {resume.toolsLabel?.trim() || "Tools"}
      </h2>,
      <div className="ml-inline" key="tools-v">
        {resume.tools.join(" · ")}
      </div>,
    );
  }

  if (resume.interests.length > 0) {
    atoms.push(
      <h2 className="ml-h2" data-keep-with-next="true" key="int-h">
        {resume.interestsLabel?.trim() || "Interests"}
      </h2>,
      <div className="ml-inline" key="int-v">
        {resume.interests.join(" · ")}
      </div>,
    );
  }

  if (resume.extras.length > 0) {
    resume.extras.forEach((x) => {
      atoms.push(
        <div className="ml-inline" key={`extras-${x.id}`} style={{ marginTop: "1.2mm" }}>
          <strong>{x.label}:</strong> {x.value}
        </div>,
      );
    });
  }

  resume.custom
    .filter((c) => c.header.trim() && c.bullets.some((b) => b.trim()))
    .forEach((c) => {
      atoms.push(
        <h2 className="ml-h2" data-keep-with-next="true" key={`custom-h-${c.id}`}>
          {c.header}
        </h2>,
      );
      if (c.bullets.length === 1) {
        atoms.push(
          <p className="ml-summary" key={`custom-p-${c.id}`}>
            <RichText value={c.bullets[0]} />
          </p>,
        );
      } else {
        pushSplitItem(atoms, {
          keyPrefix: `custom-${c.id}`,
          bullets: c.bullets,
          renderBullet: (bullet, i, total) => {
            const cls = [
              "ml-ul-bullet",
              i === 0 ? "ml-ul-bullet-first" : "",
              i === total - 1 ? "ml-ul-bullet-last" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <ul className={cls}>
                <li>
                  <RichText value={bullet} />
                </li>
              </ul>
            );
          },
        });
      }
    });

  return (
    <>
      <style>{css}</style>
      <PaginatedCanvas mainPaddingMm={[18, 20]} pageClassName="ml-root">
        {atoms}
      </PaginatedCanvas>
    </>
  );
});
