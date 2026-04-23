/**
 * Executive Serif template.
 *
 * A formal, print-friendly layout reminiscent of an executive CV.
 * Instrument Serif for names and section titles pairs with Geist in
 * the body. Designed for senior leadership roles where the emphasis
 * is on gravitas rather than visual flourish.
 *
 * Uses the shared `PaginatedCanvas` so long content flows onto
 * additional A4 pages at clean section boundaries.
 */

import { memo } from "react";
import { PaginatedCanvas } from "../components/PaginatedCanvas.tsx";
import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { findLogoIcon } from "../utils/logoIcons.ts";
import { RichText } from "../utils/richText.tsx";
import {
  certificationLink,
  contactIcon,
  formatDateRange,
  formatLocation,
  renderContactValue,
  splitSkills,
} from "./shared.tsx";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export const ExecutiveSerif = memo(function ExecutiveSerif({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const css = `
    .es-root { font-family: 'Geist', 'Inter', sans-serif; color: #1f2937; font-size: 9.4pt; line-height: 1.5; overflow-wrap: break-word; word-break: break-word; hyphens: auto; }
    .es-head { text-align: center; border-bottom: 1px solid ${palette.primary200}; padding-bottom: 5mm; margin-bottom: 6mm; }
    .es-logo { width: 13mm; height: 13mm; border-radius: 50%; margin: 0 auto 3mm; border: 1.5px solid ${palette.primary600}; color: ${palette.primary600}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .es-name { font-family: 'Instrument Serif', 'Iowan Old Style', Georgia, serif; font-size: 26pt; font-weight: 700; letter-spacing: 0.5px; color: #111827; margin: 0; overflow-wrap: break-word; }
    .es-title { font-size: 10pt; color: ${palette.primary700}; letter-spacing: 3px; text-transform: uppercase; margin-top: 2mm; font-weight: 600; overflow-wrap: break-word; }
    .es-contact { display: flex; justify-content: center; flex-wrap: wrap; gap: 2mm 5mm; margin-top: 3.5mm; font-size: 8.8pt; color: #4b5563; }
    .es-contact span { display: inline-flex; align-items: center; gap: 1.2mm; max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
    .es-contact svg { color: ${palette.primary600}; flex-shrink: 0; }
    .es-h2 { font-family: 'Instrument Serif', 'Iowan Old Style', Georgia, serif; font-size: 14pt; font-weight: 700; color: #111827; text-align: center; margin: 5.5mm 0 4mm; position: relative; break-after: avoid; page-break-after: avoid; }
    .es-h2 span { background: #ffffff; padding: 0 4mm; position: relative; z-index: 1; }
    .es-h2::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: ${palette.primary200}; z-index: 0; }
    .es-summary { font-size: 9.5pt; line-height: 1.65; text-align: justify; color: #1e293b; hyphens: auto; overflow-wrap: break-word; }
    .es-job { margin-bottom: 4mm; page-break-inside: avoid; break-inside: avoid; }
    .es-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; flex-wrap: wrap; }
    .es-jobtitle { font-size: 10.5pt; font-weight: 700; color: #111827; font-family: 'Instrument Serif', 'Iowan Old Style', Georgia, serif; min-width: 0; flex: 1 1 auto; overflow-wrap: break-word; }
    .es-jobmeta { font-size: 8.8pt; color: #6b7280; font-style: italic; flex-shrink: 0; }
    .es-jobco { font-size: 9.5pt; color: ${palette.primary700}; font-weight: 600; margin-bottom: 1.5mm; overflow-wrap: break-word; }
    .es-job ul { list-style: none; padding: 0; margin: 0; }
    .es-job li { font-size: 9.3pt; line-height: 1.5; padding-left: 5mm; position: relative; margin-bottom: 1mm; overflow-wrap: break-word; }
    .es-job li::before { content: "—"; position: absolute; left: 0; color: ${palette.primary600}; font-weight: 700; }
    .es-skill-group { margin-bottom: 1.8mm; font-size: 9.2pt; display: grid; grid-template-columns: 42mm minmax(0, 1fr); gap: 3mm; page-break-inside: avoid; break-inside: avoid; }
    .es-skill-label { color: ${palette.primary700}; font-weight: 700; font-variant: small-caps; letter-spacing: 0.5px; display: flex; align-items: center; gap: 1.8mm; min-width: 0; overflow-wrap: break-word; }
    .es-skill-icon { width: 1em; height: 1em; color: ${palette.primary600}; flex-shrink: 0; }
    .es-skill-list { color: #1e293b; min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
    .es-edu { display: flex; justify-content: space-between; gap: 4mm; margin-bottom: 1mm; align-items: baseline; flex-wrap: wrap; page-break-inside: avoid; break-inside: avoid; }
    .es-edu > div:first-child { min-width: 0; flex: 1 1 auto; }
    .es-edutitle { font-weight: 700; color: #111827; font-size: 10pt; overflow-wrap: break-word; }
    .es-eduschool { color: ${palette.primary700}; font-size: 9pt; overflow-wrap: break-word; }
    .es-edumeta { color: #6b7280; font-size: 8.8pt; font-style: italic; flex-shrink: 0; }
    .es-two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 6mm; }
    .es-two > div { min-width: 0; }
    .es-item { font-size: 9pt; margin-bottom: 1.6mm; overflow-wrap: break-word; }
    .es-item strong { color: #111827; overflow-wrap: break-word; }
    .es-proj { margin-bottom: 3mm; padding-bottom: 2.5mm; border-bottom: 1px dashed #e5e7eb; page-break-inside: avoid; break-inside: avoid; }
    .es-proj:last-child { border-bottom: 0; }
    .es-projname { font-family: 'Instrument Serif', 'Iowan Old Style', Georgia, serif; font-size: 10.2pt; font-weight: 700; color: #111827; margin-bottom: 1mm; overflow-wrap: break-word; }
    .es-projdesc { font-size: 9pt; color: #27272a; line-height: 1.5; margin-bottom: 1mm; overflow-wrap: break-word; }
    .es-projrole { font-size: 8.8pt; color: #4b5563; font-style: italic; margin-bottom: 1mm; overflow-wrap: break-word; }
    .es-projstack { font-size: 8.5pt; color: ${palette.primary700}; font-weight: 600; overflow-wrap: anywhere; }
    .es-pill { display: inline-block; border: 1px solid ${palette.primary200}; color: ${palette.primary900}; padding: 0.3mm 2mm; margin: 0.3mm; border-radius: 3px; font-size: 8pt; font-weight: 600; background: ${palette.primary50}; max-width: 100%; overflow-wrap: break-word; word-break: break-word; }
  `;

  const atoms: React.ReactNode[] = [];

  atoms.push(
    <header className="es-head" key="head">
      {logo && (
        <div className="es-logo">
          <logo.Icon style={{ width: "7mm", height: "7mm" }} />
        </div>
      )}
      <h1 className="es-name">{resume.profile.name}</h1>
      <div className="es-title">{resume.profile.title}</div>
      <div className="es-contact">
        {resume.contact.map((c) => (
          <span key={c.id}>
            {contactIcon(c.kind, 10)}
            {renderContactValue(c)}
          </span>
        ))}
      </div>
    </header>,
  );

  if (resume.profile.summary) {
    atoms.push(
      <h2 className="es-h2" data-keep-with-next="true" key="summary-h">
        <span>Profile</span>
      </h2>,
      <p className="es-summary" key="summary-p">
        <RichText value={resume.profile.summary} />
      </p>,
    );
  }

  if (resume.experience.length > 0) {
    atoms.push(
      <h2 className="es-h2" data-keep-with-next="true" key="exp-h">
        <span>Experience</span>
      </h2>,
    );
    resume.experience.forEach((job) => {
      atoms.push(
        <div className="es-job" key={`exp-${job.id}`}>
          <div className="es-jobhead">
            <div className="es-jobtitle">{job.title}</div>
            <div className="es-jobmeta">
              {formatDateRange(job.start, job.end)}
              {formatLocation(job.location, " · ")}
            </div>
          </div>
          <div className="es-jobco">{job.company}</div>
          <ul>
            {job.bullets.map((b, i) => (
              // oxlint-disable-next-line jsx/no-array-index-key
              <li key={`${job.id}-b-${i}`}>
                <RichText value={b} />
              </li>
            ))}
          </ul>
        </div>,
      );
    });
  }

  if (resume.skills.length > 0) {
    atoms.push(
      <h2 className="es-h2" data-keep-with-next="true" key="skills-h">
        <span>Core Competencies</span>
      </h2>,
    );
    resume.skills.forEach((g) => {
      const GroupIcon = findLogoIcon(g.iconName)?.Icon;
      atoms.push(
        <div key={`skills-${g.id}`} className="es-skill-group">
          <div className="es-skill-label">
            {GroupIcon && <GroupIcon className="es-skill-icon" />}
            <span>{g.label}</span>
          </div>
          <div className="es-skill-list">{splitSkills(g.items).join(" · ")}</div>
        </div>,
      );
    });
  }

  if (resume.projects.length > 0) {
    atoms.push(
      <h2 className="es-h2" data-keep-with-next="true" key="proj-h">
        <span>Selected Projects</span>
      </h2>,
    );
    resume.projects.forEach((p) => {
      atoms.push(
        <div className="es-proj" key={`proj-${p.id}`}>
          <div className="es-projname">{p.name}</div>
          <div className="es-projdesc">
            <RichText value={p.description} />
          </div>
          {p.role && <div className="es-projrole">{p.role}</div>}
          {p.stack.length > 0 && <div className="es-projstack">{p.stack.join(" · ")}</div>}
        </div>,
      );
    });
  }

  if (resume.education.length > 0) {
    atoms.push(
      <h2 className="es-h2" data-keep-with-next="true" key="edu-h">
        <span>Education</span>
      </h2>,
    );
    resume.education.forEach((ed) => {
      atoms.push(
        <div className="es-edu" key={`edu-${ed.id}`}>
          <div>
            <div className="es-edutitle">{ed.degree}</div>
            <div className="es-eduschool">
              {ed.school}
              {formatLocation(ed.location)}
            </div>
          </div>
          <div className="es-edumeta">
            {formatDateRange(ed.start, ed.end)}
            {ed.detail ? ` · ${ed.detail}` : ""}
          </div>
        </div>,
      );
    });
  }

  // Recognition: 2-col grid layout — kept as a single atom so the grid
  // survives intact. Small enough to fit on a page in realistic content.
  if (resume.certifications.length > 0 || resume.awards.length > 0) {
    atoms.push(
      <div key="rec">
        <h2 className="es-h2">
          <span>Recognition</span>
        </h2>
        <div className="es-two">
          {resume.certifications.length > 0 && (
            <div>
              {resume.certifications.map((c) => (
                <div className="es-item" key={c.id}>
                  {certificationLink(c, <strong>{c.name}</strong>)} — {c.issuer}
                  {c.year ? ` · ${c.year}` : ""}
                </div>
              ))}
            </div>
          )}
          {resume.awards.length > 0 && (
            <div>
              {resume.awards.map((a) => (
                <div className="es-item" key={a.id}>
                  <strong>
                    {a.title}
                    {a.year ? ` · ${a.year}` : ""}
                  </strong>
                  {a.detail ? ` — ${a.detail}` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>,
    );
  }

  // Additional: 2-col grid layout — kept as a single atom.
  if (
    resume.languages.length > 0 ||
    resume.interests.length > 0 ||
    resume.tools.length > 0 ||
    resume.extras.length > 0
  ) {
    atoms.push(
      <div key="add">
        <h2 className="es-h2">
          <span>Additional</span>
        </h2>
        <div className="es-two">
          {resume.languages.length > 0 && (
            <div>
              <strong style={{ color: palette.primary700 }}>Languages · </strong>
              {resume.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}
            </div>
          )}
          {resume.interests.length > 0 && (
            <div>
              <strong style={{ color: palette.primary700 }}>
                {resume.interestsLabel?.trim() || "Interests"} ·{" "}
              </strong>
              {resume.interests.map((t, i) => (
                // oxlint-disable-next-line jsx/no-array-index-key
                <span className="es-pill" key={i}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        {resume.tools.length > 0 && (
          <div style={{ marginTop: "2mm" }}>
            <strong style={{ color: palette.primary700 }}>
              {resume.toolsLabel?.trim() || "Tools"} ·{" "}
            </strong>
            {resume.tools.map((t, i) => (
              // oxlint-disable-next-line jsx/no-array-index-key
              <span className="es-pill" key={i}>
                {t}
              </span>
            ))}
          </div>
        )}
        {resume.extras.length > 0 && (
          <div style={{ marginTop: "2mm" }}>
            {resume.extras.map((x) => (
              <div className="es-item" key={x.id}>
                <strong>{x.label}:</strong> {x.value}
              </div>
            ))}
          </div>
        )}
      </div>,
    );
  }

  resume.custom
    .filter((c) => c.header.trim() && c.bullets.some((b) => b.trim()))
    .forEach((c) => {
      atoms.push(
        <h2 className="es-h2" data-keep-with-next="true" key={`custom-h-${c.id}`}>
          <span>{c.header}</span>
        </h2>,
      );
      if (c.bullets.length === 1) {
        atoms.push(
          <p className="es-summary" key={`custom-p-${c.id}`}>
            <RichText value={c.bullets[0]} />
          </p>,
        );
      } else {
        atoms.push(
          <div className="es-job" key={`custom-${c.id}`}>
            <ul>
              {c.bullets.map((b, i) => (
                // oxlint-disable-next-line jsx/no-array-index-key
                <li key={`${c.id}-b-${i}`}>
                  <RichText value={b} />
                </li>
              ))}
            </ul>
          </div>,
        );
      }
    });

  return (
    <>
      <style>{css}</style>
      <PaginatedCanvas mainPaddingMm={[16, 18]} pageClassName="es-root">
        {atoms}
      </PaginatedCanvas>
    </>
  );
});
