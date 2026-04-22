/**
 * ATS Professional template.
 *
 * Single-column layout that stays ATS-parseable while looking more
 * polished than the raw plain variant: accent-coloured section headers
 * on a thin underline, a left-aligned name block, and real bullets
 * rendered as text (never images). No multi-column text, no sidebars,
 * no tables — all structure an ATS can follow.
 *
 * The accent colour respects the user's chosen primary so the resume
 * still fits the rest of their job application, while the body copy
 * stays black for contrast and readability.
 *
 * Uses the shared `PaginatedCanvas` so content that exceeds a single
 * A4 page auto-flows onto additional pages at clean section breaks.
 */

import { PaginatedCanvas } from "../components/PaginatedCanvas.tsx";
import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { RichText } from "../utils/richText.tsx";
import { certificationLink, renderContactValue, splitSkills } from "./shared.tsx";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export function AtsProfessional({ resume, palette }: Props) {
  const css = `
    .atp-root { font-family: 'Geist', 'Inter', 'Calibri', Arial, Helvetica, sans-serif; color: #111827; font-size: 10.5pt; line-height: 1.5; }
    .atp-header { margin-bottom: 3mm; }
    .atp-name { font-size: 22pt; font-weight: 700; margin: 0; letter-spacing: -0.3px; color: #0b1220; line-height: 1.1; }
    .atp-title { font-size: 11.5pt; font-weight: 500; color: ${palette.primary700}; margin-top: 1mm; letter-spacing: 0.2px; }
    .atp-contact { font-size: 10pt; color: #374151; margin-top: 2.5mm; display: flex; flex-wrap: wrap; gap: 1mm 3mm; }
    .atp-contact .sep { color: #9ca3af; }
    .atp-rule { border: 0; border-top: 1.5px solid ${palette.primary600}; margin: 3mm 0 3mm; }
    .atp-h2 { font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: ${palette.primary700}; margin: 5.5mm 0 2mm; padding-bottom: 1mm; border-bottom: 1px solid ${palette.primary200}; break-after: avoid; page-break-after: avoid; }
    .atp-p { font-size: 10.5pt; margin: 0 0 2mm; color: #1f2937; line-height: 1.5; }
    .atp-entry { margin-bottom: 3.5mm; page-break-inside: avoid; break-inside: avoid; }
    .atp-row { display: flex; justify-content: space-between; gap: 6mm; align-items: baseline; }
    .atp-role { font-size: 11pt; font-weight: 600; color: #111827; }
    .atp-company { font-size: 10.5pt; color: ${palette.primary700}; font-weight: 500; }
    .atp-dates { font-size: 9.8pt; color: #6b7280; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .atp-location { font-size: 9.8pt; color: #6b7280; }
    .atp-ul { margin: 1.5mm 0 0; padding-left: 5mm; list-style: disc; }
    .atp-ul li { font-size: 10.3pt; margin: 0 0 1mm; color: #1f2937; line-height: 1.45; padding-left: 1mm; }
    .atp-ul li::marker { color: ${palette.primary600}; }
    .atp-skill-row { font-size: 10.3pt; margin-bottom: 1.5mm; color: #1f2937; }
    .atp-skill-row strong { color: #111827; font-weight: 600; margin-right: 1mm; }
    .atp-kv { font-size: 10.3pt; margin-bottom: 1mm; }
    .atp-kv strong { color: #111827; font-weight: 600; }
    .atp-cert-year { color: #6b7280; font-style: italic; }
  `;

  const visibleContacts = resume.contact.filter((c) => c.value.trim());
  const atoms: React.ReactNode[] = [];

  atoms.push(
    <header className="atp-header" key="head">
      <h1 className="atp-name">{resume.profile.name}</h1>
      {resume.profile.title && <div className="atp-title">{resume.profile.title}</div>}
      {visibleContacts.length > 0 && (
        <div className="atp-contact">
          {visibleContacts.map((c, i) => (
            <span key={c.id}>
              {renderContactValue(c)}
              {i < visibleContacts.length - 1 && <span className="sep"> · </span>}
            </span>
          ))}
        </div>
      )}
      <hr className="atp-rule" />
    </header>,
  );

  if (resume.profile.summary) {
    atoms.push(
      <h2 className="atp-h2" data-keep-with-next="true" key="summary-h">
        Professional Summary
      </h2>,
      <p className="atp-p" key="summary-p">
        <RichText value={resume.profile.summary} />
      </p>,
    );
  }

  if (resume.skills.length > 0) {
    atoms.push(
      <h2 className="atp-h2" data-keep-with-next="true" key="skills-h">
        Core Skills
      </h2>,
    );
    resume.skills.forEach((g) => {
      atoms.push(
        <div className="atp-skill-row" key={`skills-${g.id}`}>
          <strong>{g.label}:</strong>
          {splitSkills(g.items).join(", ")}
        </div>,
      );
    });
  }

  if (resume.experience.length > 0) {
    atoms.push(
      <h2 className="atp-h2" data-keep-with-next="true" key="exp-h">
        Professional Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      atoms.push(
        <div className="atp-entry" key={`exp-${job.id}`}>
          <div className="atp-row">
            <span className="atp-role">{job.title}</span>
            <span className="atp-dates">
              {job.start}
              {job.end ? ` – ${job.end}` : ""}
            </span>
          </div>
          <div className="atp-row">
            <span className="atp-company">{job.company}</span>
            <span className="atp-location">{job.location}</span>
          </div>
          {job.bullets.length > 0 && (
            <ul className="atp-ul">
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
      <h2 className="atp-h2" data-keep-with-next="true" key="proj-h">
        Key Projects
      </h2>,
    );
    resume.projects.forEach((p) => {
      atoms.push(
        <div className="atp-entry" key={`proj-${p.id}`}>
          <div className="atp-row">
            <span className="atp-role">{p.name}</span>
            {p.role && <span className="atp-location">{p.role}</span>}
          </div>
          {p.description && (
            <p className="atp-p">
              <RichText value={p.description} />
            </p>
          )}
          {p.stack.length > 0 && (
            <div className="atp-kv">
              <strong>Technologies:</strong> {p.stack.join(", ")}
            </div>
          )}
        </div>,
      );
    });
  }

  if (resume.education.length > 0) {
    atoms.push(
      <h2 className="atp-h2" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      atoms.push(
        <div className="atp-entry" key={`edu-${ed.id}`}>
          <div className="atp-row">
            <span className="atp-role">{ed.degree}</span>
            <span className="atp-dates">
              {ed.start}
              {ed.end ? ` – ${ed.end}` : ""}
            </span>
          </div>
          <div className="atp-row">
            <span className="atp-company">
              {ed.school}
              {ed.location ? `, ${ed.location}` : ""}
            </span>
            {ed.detail && <span className="atp-location">{ed.detail}</span>}
          </div>
        </div>,
      );
    });
  }

  if (resume.certifications.length > 0) {
    atoms.push(
      <h2 className="atp-h2" data-keep-with-next="true" key="cert-h">
        Certifications
      </h2>,
    );
    resume.certifications.forEach((c) => {
      atoms.push(
        <div className="atp-kv" key={`cert-${c.id}`}>
          {certificationLink(c, <strong>{c.name}</strong>)}
          {c.issuer ? `, ${c.issuer}` : ""}
          {c.year ? <span className="atp-cert-year"> ({c.year})</span> : null}
        </div>,
      );
    });
  }

  if (resume.awards.length > 0) {
    atoms.push(
      <h2 className="atp-h2" data-keep-with-next="true" key="award-h">
        Awards
      </h2>,
    );
    resume.awards.forEach((a) => {
      atoms.push(
        <div className="atp-kv" key={`award-${a.id}`}>
          <strong>{a.title}</strong>
          {a.year ? <span className="atp-cert-year"> ({a.year})</span> : null}
          {a.detail ? ` — ${a.detail}` : ""}
        </div>,
      );
    });
  }

  if (resume.languages.length > 0) {
    atoms.push(
      <h2 className="atp-h2" data-keep-with-next="true" key="lang-h">
        Languages
      </h2>,
      <div className="atp-kv" key="lang-v">
        {resume.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(", ")}
      </div>,
    );
  }

  if (resume.tools.length > 0) {
    atoms.push(
      <h2 className="atp-h2" data-keep-with-next="true" key="tools-h">
        {resume.toolsLabel?.trim() || "Tools"}
      </h2>,
      <div className="atp-kv" key="tools-v">
        {resume.tools.join(", ")}
      </div>,
    );
  }

  if (resume.interests.length > 0) {
    atoms.push(
      <h2 className="atp-h2" data-keep-with-next="true" key="int-h">
        {resume.interestsLabel?.trim() || "Interests"}
      </h2>,
      <div className="atp-kv" key="int-v">
        {resume.interests.join(", ")}
      </div>,
    );
  }

  if (resume.extras.length > 0) {
    atoms.push(
      <h2 className="atp-h2" data-keep-with-next="true" key="extras-h">
        Additional Information
      </h2>,
    );
    resume.extras.forEach((x) => {
      atoms.push(
        <div className="atp-kv" key={`extras-${x.id}`}>
          <strong>{x.label}:</strong> {x.value}
        </div>,
      );
    });
  }

  return (
    <>
      <style>{css}</style>
      <PaginatedCanvas mainPaddingMm={[14, 15]} pageClassName="atp-root">
        {atoms}
      </PaginatedCanvas>
    </>
  );
}
