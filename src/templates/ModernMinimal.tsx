/**
 * Modern Minimal template.
 *
 * Single-column, generous whitespace. Header block carries name, title,
 * and a thin accent rule. Two-column layout inside each section keeps
 * information scannable without the heaviness of a tinted sidebar.
 *
 * Uses the shared `PaginatedCanvas` so long content flows onto
 * additional A4 pages at clean section boundaries.
 */

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

export function ModernMinimal({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const css = `
    .mm-root { font-family: 'Geist', 'Inter', sans-serif; color: #1f2937; font-size: 9.5pt; line-height: 1.45; }
    .mm-head { border-bottom: 3px solid ${palette.primary600}; padding-bottom: 4mm; margin-bottom: 6mm; display: flex; align-items: flex-start; gap: 5mm; }
    .mm-head-body { flex: 1; }
    .mm-logo { width: 16mm; height: 16mm; border-radius: 4mm; background: ${palette.primary600}; color: ${palette.primaryText}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .mm-name { font-size: 22pt; font-weight: 700; color: #111827; letter-spacing: -0.3px; margin: 0; }
    .mm-title { font-size: 11pt; color: ${palette.primary600}; font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase; margin-top: 1.2mm; }
    .mm-contact { display: flex; flex-wrap: wrap; gap: 3mm 5mm; margin-top: 4mm; font-size: 8.6pt; color: #4b5563; }
    .mm-contact span { display: inline-flex; align-items: center; gap: 1.2mm; }
    .mm-contact svg { color: ${palette.primary600}; }
    .mm-h2 { font-size: 9.4pt; text-transform: uppercase; letter-spacing: 1.5px; color: ${palette.primary600}; font-weight: 700; margin: 5.5mm 0 3mm; display: flex; align-items: center; gap: 3mm; break-after: avoid; page-break-after: avoid; }
    .mm-h2::after { content: ""; flex: 1; height: 1px; background: #e5e7eb; }
    .mm-summary { font-size: 9.5pt; line-height: 1.55; color: #1e293b; }
    .mm-grid { display: grid; grid-template-columns: 28mm 1fr; gap: 3mm 5mm; }
    .mm-job { display: grid; grid-template-columns: 38mm 1fr; gap: 4mm; margin-bottom: 4mm; page-break-inside: avoid; break-inside: avoid; }
    .mm-jobmeta { font-size: 8.5pt; color: #6b7280; }
    .mm-jobmeta .co { color: ${palette.primary700}; font-weight: 700; font-size: 9.2pt; display: block; margin-bottom: 0.5mm; }
    .mm-jobmeta .dates { display: block; margin-top: 0.5mm; }
    .mm-jobtitle { font-size: 10pt; font-weight: 700; color: #111827; margin-bottom: 1.5mm; }
    .mm-job ul { list-style: none; padding: 0; margin: 0; }
    .mm-job li { font-size: 9pt; line-height: 1.45; padding-left: 4mm; position: relative; margin-bottom: 1mm; color: #27272a; }
    .mm-job li::before { content: ""; position: absolute; left: 0; top: 1.6mm; width: 1.8mm; height: 1.8mm; background: ${palette.primary600}; border-radius: 50%; }
    .mm-skill-col { display: grid; grid-template-columns: 36mm 1fr; gap: 2mm 4mm; margin-bottom: 1.2mm; font-size: 9pt; page-break-inside: avoid; break-inside: avoid; }
    .mm-skill-label { color: #111827; font-weight: 700; display: flex; align-items: center; gap: 1.8mm; }
    .mm-skill-icon { width: 1em; height: 1em; color: ${palette.primary600}; flex-shrink: 0; }
    .mm-skill-list { color: #27272a; }
    .mm-proj { border-left: 2px solid ${palette.primary600}; padding: 0 0 0 4mm; margin-bottom: 3mm; page-break-inside: avoid; break-inside: avoid; }
    .mm-projhead { display: flex; justify-content: space-between; align-items: baseline; gap: 3mm; }
    .mm-projname { font-size: 9.6pt; font-weight: 700; color: #111827; }
    .mm-projdesc { font-size: 8.9pt; color: #374151; margin-top: 1mm; line-height: 1.45; }
    .mm-projstack { font-size: 8.3pt; color: ${palette.primary700}; font-weight: 600; margin-top: 1mm; }
    .mm-edu { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.5mm; page-break-inside: avoid; break-inside: avoid; }
    .mm-edutitle { font-weight: 700; color: #111827; font-size: 9.4pt; }
    .mm-eduschool { color: ${palette.primary700}; font-size: 8.8pt; }
    .mm-edumeta { color: #6b7280; font-size: 8.6pt; }
    .mm-three { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; }
    .mm-cert { font-size: 8.8pt; margin-bottom: 1.5mm; }
    .mm-cert strong { color: #111827; display: block; }
    .mm-cert .year { color: #6b7280; font-style: italic; }
    .mm-pill { display: inline-block; background: ${palette.primary50}; border: 1px solid ${palette.primary200}; color: ${palette.primary900}; padding: 0.4mm 1.8mm; margin: 0.4mm; border-radius: 999px; font-size: 7.8pt; font-weight: 600; }
    .mm-kv { font-size: 8.8pt; margin-bottom: 1.2mm; }
    .mm-kv strong { color: #111827; }
  `;

  const atoms: React.ReactNode[] = [];

  atoms.push(
    <header className="mm-head" key="head">
      {logo && (
        <div className="mm-logo">
          <logo.Icon style={{ width: "9mm", height: "9mm" }} />
        </div>
      )}
      <div className="mm-head-body">
        <h1 className="mm-name">{resume.profile.name}</h1>
        <div className="mm-title">{resume.profile.title}</div>
        <div className="mm-contact">
          {resume.contact.map((c) => (
            <span key={c.id}>
              {contactIcon(c.kind, 11)}
              {renderContactValue(c)}
            </span>
          ))}
        </div>
      </div>
    </header>,
  );

  if (resume.profile.summary) {
    atoms.push(
      <h2 className="mm-h2" data-keep-with-next="true" key="summary-h">
        Summary
      </h2>,
      <p className="mm-summary" key="summary-p">
        <RichText value={resume.profile.summary} />
      </p>,
    );
  }

  if (resume.experience.length > 0) {
    atoms.push(
      <h2 className="mm-h2" data-keep-with-next="true" key="exp-h">
        Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      atoms.push(
        <div className="mm-job" key={`exp-${job.id}`}>
          <div className="mm-jobmeta">
            <span className="co">{job.company}</span>
            {job.location}
            <span className="dates">{formatDateRange(job.start, job.end)}</span>
          </div>
          <div>
            <div className="mm-jobtitle">{job.title}</div>
            <ul>
              {job.bullets.map((b, i) => (
                // oxlint-disable-next-line jsx/no-array-index-key
                <li key={`${job.id}-b-${i}`}>
                  <RichText value={b} />
                </li>
              ))}
            </ul>
          </div>
        </div>,
      );
    });
  }

  if (resume.skills.length > 0) {
    atoms.push(
      <h2 className="mm-h2" data-keep-with-next="true" key="skills-h">
        Skills
      </h2>,
    );
    resume.skills.forEach((g) => {
      const GroupIcon = findLogoIcon(g.iconName)?.Icon;
      atoms.push(
        <div key={`skills-${g.id}`} className="mm-skill-col">
          <div className="mm-skill-label">
            {GroupIcon && <GroupIcon className="mm-skill-icon" />}
            <span>{g.label}</span>
          </div>
          <div className="mm-skill-list">{splitSkills(g.items).join(" · ")}</div>
        </div>,
      );
    });
  }

  if (resume.projects.length > 0) {
    atoms.push(
      <h2 className="mm-h2" data-keep-with-next="true" key="proj-h">
        Projects
      </h2>,
    );
    resume.projects.forEach((p) => {
      atoms.push(
        <div className="mm-proj" key={`proj-${p.id}`}>
          <div className="mm-projhead">
            <div className="mm-projname">{p.name}</div>
          </div>
          <div className="mm-projdesc">
            <RichText value={p.description} />
            {p.role ? ` ${p.role}` : ""}
          </div>
          {p.stack.length > 0 && <div className="mm-projstack">{p.stack.join(" · ")}</div>}
        </div>,
      );
    });
  }

  if (resume.education.length > 0) {
    atoms.push(
      <h2 className="mm-h2" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      atoms.push(
        <div className="mm-edu" key={`edu-${ed.id}`}>
          <div>
            <div className="mm-edutitle">{ed.degree}</div>
            <div className="mm-eduschool">
              {ed.school}
              {formatLocation(ed.location)}
            </div>
          </div>
          <div className="mm-edumeta">
            {formatDateRange(ed.start, ed.end)}
            {ed.detail ? ` · ${ed.detail}` : ""}
          </div>
        </div>,
      );
    });
  }

  // Tail: 3-column grid couples certifications + awards + langs/interests.
  // Kept as a single atom so the grid layout is preserved; it's small
  // enough to fit within a page in realistic content sizes.
  if (
    resume.certifications.length > 0 ||
    resume.awards.length > 0 ||
    resume.languages.length > 0 ||
    resume.interests.length > 0 ||
    resume.extras.length > 0
  ) {
    atoms.push(
      <div className="mm-three" key="tail">
        {resume.certifications.length > 0 && (
          <div>
            <h2 className="mm-h2">Certifications</h2>
            {resume.certifications.map((c) => (
              <div className="mm-cert" key={c.id}>
                {certificationLink(c, <strong>{c.name}</strong>)}
                {c.issuer}
                {c.year ? <span className="year"> · {c.year}</span> : null}
              </div>
            ))}
          </div>
        )}
        {resume.awards.length > 0 && (
          <div>
            <h2 className="mm-h2">Awards</h2>
            {resume.awards.map((a) => (
              <div className="mm-cert" key={a.id}>
                <strong>{a.title}</strong>
                {a.detail}
                {a.year ? <span className="year"> · {a.year}</span> : null}
              </div>
            ))}
          </div>
        )}
        {(resume.languages.length > 0 ||
          resume.interests.length > 0 ||
          resume.extras.length > 0) && (
          <div>
            {resume.languages.length > 0 && (
              <>
                <h2 className="mm-h2">Languages</h2>
                {resume.languages.map((l) => (
                  <div className="mm-kv" key={l.id}>
                    <strong>{l.name}</strong> — {l.level}
                  </div>
                ))}
              </>
            )}
            {resume.interests.length > 0 && (
              <div style={{ marginTop: "2.5mm" }}>
                <h2 className="mm-h2">{resume.interestsLabel?.trim() || "Interests"}</h2>
                {resume.interests.map((t, i) => (
                  // oxlint-disable-next-line jsx/no-array-index-key
                  <span className="mm-pill" key={i}>
                    {t}
                  </span>
                ))}
              </div>
            )}
            {resume.extras.length > 0 && (
              <div style={{ marginTop: "2.5mm" }}>
                {resume.extras.map((x) => (
                  <div className="mm-kv" key={x.id}>
                    <strong>{x.label}:</strong> {x.value}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>,
    );
  }

  resume.custom
    .filter((c) => c.header.trim() && c.bullets.some((b) => b.trim()))
    .forEach((c) => {
      atoms.push(
        <h2 className="mm-h2" data-keep-with-next="true" key={`custom-h-${c.id}`}>
          {c.header}
        </h2>,
      );
      if (c.bullets.length === 1) {
        atoms.push(
          <p className="mm-summary" key={`custom-p-${c.id}`}>
            <RichText value={c.bullets[0]} />
          </p>,
        );
      } else {
        atoms.push(
          <div className="mm-job" key={`custom-${c.id}`} style={{ display: "block" }}>
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
      <PaginatedCanvas mainPaddingMm={[14, 16]} pageClassName="mm-root">
        {atoms}
      </PaginatedCanvas>
    </>
  );
}
