/**
 * ATS Plain template.
 *
 * A single-column, zero-graphics layout designed for maximum parseability
 * by applicant tracking systems. No sidebars, no columns, no icons, no
 * coloured blocks — just headings and text in a standard sans-serif font
 * so screening software and PDF-text extractors read everything cleanly.
 *
 * Design rules (follows most ATS-friendly guidelines):
 *   - Single column, linear top-to-bottom flow
 *   - Standard system-safe sans-serif font (Arial fallback)
 *   - Clear section headings (SUMMARY, EXPERIENCE, etc.)
 *   - Plain dash bullets ("- …"), no custom glyphs
 *   - No images, no logos, no icons
 *   - Standard date formatting "MMM YYYY – MMM YYYY"
 *
 * Uses the shared `PaginatedCanvas` so long resumes auto-flow across
 * multiple A4 pages at clean section boundaries instead of overflowing
 * a single page.
 */

import { PaginatedCanvas } from "../components/PaginatedCanvas.tsx";
import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { RichText } from "../utils/richText.tsx";
import { splitSkills } from "./shared.tsx";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export function AtsPlain({ resume }: Props) {
  const css = `
    .ats-root { font-family: Arial, Helvetica, 'Liberation Sans', sans-serif; color: #000; font-size: 10.5pt; line-height: 1.45; }
    .ats-name { font-size: 20pt; font-weight: 700; margin: 0; letter-spacing: 0.5px; color: #000; }
    .ats-title { font-size: 11pt; margin: 1mm 0 2mm; color: #000; }
    .ats-contact { font-size: 10pt; color: #000; margin-bottom: 4mm; }
    .ats-contact span + span::before { content: " | "; color: #000; }
    .ats-hr { border: 0; border-top: 1px solid #000; margin: 3mm 0 4mm; }
    .ats-h2 { font-size: 11.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #000; margin: 5mm 0 2mm; border-bottom: 1px solid #000; padding-bottom: 1mm; break-after: avoid; page-break-after: avoid; }
    .ats-p { font-size: 10.5pt; color: #000; margin: 0 0 2mm; }
    .ats-job, .ats-edu, .ats-proj, .ats-cert, .ats-award { margin-bottom: 3.5mm; page-break-inside: avoid; break-inside: avoid; }
    .ats-row { display: flex; justify-content: space-between; gap: 6mm; font-size: 10.5pt; }
    .ats-strong { font-weight: 700; color: #000; }
    .ats-italic { font-style: italic; color: #000; }
    .ats-ul { margin: 1mm 0 0; padding-left: 5mm; list-style: disc; }
    .ats-ul li { font-size: 10.5pt; margin: 0 0 1mm; color: #000; line-height: 1.45; }
    .ats-kv { font-size: 10.5pt; margin-bottom: 1mm; color: #000; }
    .ats-skill-row { font-size: 10.5pt; margin-bottom: 1.5mm; color: #000; }
    .ats-skill-row .ats-strong { margin-right: 1mm; }
  `;

  const contactLine = resume.contact.map((c) => c.value).filter(Boolean);

  const atoms: React.ReactNode[] = [];

  atoms.push(
    <header key="head">
      <h1 className="ats-name">{resume.profile.name}</h1>
      {resume.profile.title && <div className="ats-title">{resume.profile.title}</div>}
      {contactLine.length > 0 && (
        <div className="ats-contact">
          {contactLine.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>
      )}
      <hr className="ats-hr" />
    </header>,
  );

  if (resume.profile.summary) {
    atoms.push(
      <h2 className="ats-h2" data-keep-with-next="true" key="summary-h">
        Summary
      </h2>,
      <p className="ats-p" key="summary-p">
        <RichText value={resume.profile.summary} />
      </p>,
    );
  }

  if (resume.skills.length > 0) {
    atoms.push(
      <h2 className="ats-h2" data-keep-with-next="true" key="skills-h">
        Skills
      </h2>,
    );
    resume.skills.forEach((g) => {
      atoms.push(
        <div className="ats-skill-row" key={`skills-${g.id}`}>
          <span className="ats-strong">{g.label}:</span>
          <span>{splitSkills(g.items).join(", ")}</span>
        </div>,
      );
    });
  }

  if (resume.experience.length > 0) {
    atoms.push(
      <h2 className="ats-h2" data-keep-with-next="true" key="exp-h">
        Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      atoms.push(
        <div className="ats-job" key={`exp-${job.id}`}>
          <div className="ats-row">
            <span>
              <span className="ats-strong">{job.title}</span>
              {job.company ? `, ${job.company}` : ""}
            </span>
            <span className="ats-italic">
              {job.start}
              {job.end ? ` – ${job.end}` : ""}
            </span>
          </div>
          {job.location && <div className="ats-italic">{job.location}</div>}
          {job.bullets.length > 0 && (
            <ul className="ats-ul">
              {job.bullets.map((b, i) => (
                // oxlint-disable-next-line jsx/no-array-index-key
                <li key={`${job.id}-bullet-${i}`}>
                  <RichText value={b} />
                </li>
              ))}
            </ul>
          )}
        </div>,
      );
    });
  }

  if (resume.projects.length > 0) {
    atoms.push(
      <h2 className="ats-h2" data-keep-with-next="true" key="proj-h">
        Projects
      </h2>,
    );
    resume.projects.forEach((p) => {
      atoms.push(
        <div className="ats-proj" key={`proj-${p.id}`}>
          <div className="ats-row">
            <span className="ats-strong">{p.name}</span>
            {p.role && <span className="ats-italic">{p.role}</span>}
          </div>
          {p.description && (
            <p className="ats-p">
              <RichText value={p.description} />
            </p>
          )}
          {p.stack.length > 0 && (
            <div className="ats-kv">
              <span className="ats-strong">Technologies: </span>
              {p.stack.join(", ")}
            </div>
          )}
        </div>,
      );
    });
  }

  if (resume.education.length > 0) {
    atoms.push(
      <h2 className="ats-h2" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      atoms.push(
        <div className="ats-edu" key={`edu-${ed.id}`}>
          <div className="ats-row">
            <span>
              <span className="ats-strong">{ed.degree}</span>
              {ed.school ? `, ${ed.school}` : ""}
              {ed.location ? ` – ${ed.location}` : ""}
            </span>
            <span className="ats-italic">
              {ed.start}
              {ed.end ? ` – ${ed.end}` : ""}
            </span>
          </div>
          {ed.detail && <div className="ats-kv">{ed.detail}</div>}
        </div>,
      );
    });
  }

  if (resume.certifications.length > 0) {
    atoms.push(
      <h2 className="ats-h2" data-keep-with-next="true" key="cert-h">
        Certifications
      </h2>,
    );
    resume.certifications.forEach((c) => {
      atoms.push(
        <div className="ats-cert" key={`cert-${c.id}`}>
          <span className="ats-strong">{c.name}</span>
          {c.issuer ? `, ${c.issuer}` : ""}
          {c.year ? ` (${c.year})` : ""}
        </div>,
      );
    });
  }

  if (resume.awards.length > 0) {
    atoms.push(
      <h2 className="ats-h2" data-keep-with-next="true" key="award-h">
        Awards
      </h2>,
    );
    resume.awards.forEach((a) => {
      atoms.push(
        <div className="ats-award" key={`award-${a.id}`}>
          <span className="ats-strong">{a.title}</span>
          {a.year ? ` (${a.year})` : ""}
          {a.detail ? ` — ${a.detail}` : ""}
        </div>,
      );
    });
  }

  if (resume.languages.length > 0) {
    atoms.push(
      <h2 className="ats-h2" data-keep-with-next="true" key="lang-h">
        Languages
      </h2>,
      <div className="ats-kv" key="lang-v">
        {resume.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(", ")}
      </div>,
    );
  }

  if (resume.tools.length > 0) {
    atoms.push(
      <h2 className="ats-h2" data-keep-with-next="true" key="tools-h">
        {resume.toolsLabel?.trim() || "Tools"}
      </h2>,
      <div className="ats-kv" key="tools-v">
        {resume.tools.join(", ")}
      </div>,
    );
  }

  if (resume.interests.length > 0) {
    atoms.push(
      <h2 className="ats-h2" data-keep-with-next="true" key="int-h">
        {resume.interestsLabel?.trim() || "Interests"}
      </h2>,
      <div className="ats-kv" key="int-v">
        {resume.interests.join(", ")}
      </div>,
    );
  }

  if (resume.extras.length > 0) {
    atoms.push(
      <h2 className="ats-h2" data-keep-with-next="true" key="extras-h">
        Additional Information
      </h2>,
    );
    resume.extras.forEach((x) => {
      atoms.push(
        <div className="ats-kv" key={`extras-${x.id}`}>
          <span className="ats-strong">{x.label}: </span>
          {x.value}
        </div>,
      );
    });
  }

  return (
    <>
      <style>{css}</style>
      <PaginatedCanvas mainPaddingMm={[14, 15]} pageClassName="ats-root">
        {atoms}
      </PaginatedCanvas>
    </>
  );
}
