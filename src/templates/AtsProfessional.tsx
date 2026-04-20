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
 */

import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { splitSkills } from "./shared.tsx";
import { RichText } from "../utils/richText.tsx";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export function AtsProfessional({ resume, palette }: Props) {
  const css = `
    .atp-root { font-family: 'Geist', 'Inter', 'Calibri', Arial, Helvetica, sans-serif; color: #111827; font-size: 10.5pt; line-height: 1.5; }
    .atp-page { padding: 14mm 15mm; }
    .atp-header { margin-bottom: 3mm; }
    .atp-name { font-size: 22pt; font-weight: 700; margin: 0; letter-spacing: -0.3px; color: #0b1220; line-height: 1.1; }
    .atp-title { font-size: 11.5pt; font-weight: 500; color: ${palette.primary700}; margin-top: 1mm; letter-spacing: 0.2px; }
    .atp-contact { font-size: 10pt; color: #374151; margin-top: 2.5mm; display: flex; flex-wrap: wrap; gap: 1mm 3mm; }
    .atp-contact .sep { color: #9ca3af; }
    .atp-rule { border: 0; border-top: 1.5px solid ${palette.primary600}; margin: 3mm 0 3mm; }
    .atp-h2 { font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: ${palette.primary700}; margin: 4.5mm 0 2mm; padding-bottom: 1mm; border-bottom: 1px solid ${palette.primary200}; }
    .atp-p { font-size: 10.5pt; margin: 0 0 2mm; color: #1f2937; line-height: 1.5; }
    .atp-entry { margin-bottom: 3.5mm; page-break-inside: avoid; }
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

  const contactLine = resume.contact.map((c) => c.value).filter(Boolean);

  return (
    <div className="atp-root">
      <style>{css}</style>
      <div className="resume-page">
        <div className="atp-page">
          <header className="atp-header">
            <h1 className="atp-name">{resume.profile.name}</h1>
            {resume.profile.title && <div className="atp-title">{resume.profile.title}</div>}
            {contactLine.length > 0 && (
              <div className="atp-contact">
                {contactLine.map((v, i) => (
                  <span key={v}>
                    {v}
                    {i < contactLine.length - 1 && <span className="sep"> · </span>}
                  </span>
                ))}
              </div>
            )}
          </header>
          <hr className="atp-rule" />

          {resume.profile.summary && (
            <>
              <h2 className="atp-h2">Professional Summary</h2>
              <p className="atp-p">
                <RichText value={resume.profile.summary} />
              </p>
            </>
          )}

          {resume.skills.length > 0 && (
            <>
              <h2 className="atp-h2">Core Skills</h2>
              {resume.skills.map((g) => (
                <div className="atp-skill-row" key={g.id}>
                  <strong>{g.label}:</strong>
                  {splitSkills(g.items).join(", ")}
                </div>
              ))}
            </>
          )}

          {resume.experience.length > 0 && (
            <>
              <h2 className="atp-h2">Professional Experience</h2>
              {resume.experience.map((job) => (
                <div className="atp-entry" key={job.id}>
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
                </div>
              ))}
            </>
          )}

          {resume.projects.length > 0 && (
            <>
              <h2 className="atp-h2">Key Projects</h2>
              {resume.projects.map((p) => (
                <div className="atp-entry" key={p.id}>
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
                </div>
              ))}
            </>
          )}

          {resume.education.length > 0 && (
            <>
              <h2 className="atp-h2">Education</h2>
              {resume.education.map((ed) => (
                <div className="atp-entry" key={ed.id}>
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
                </div>
              ))}
            </>
          )}

          {resume.certifications.length > 0 && (
            <>
              <h2 className="atp-h2">Certifications</h2>
              {resume.certifications.map((c) => (
                <div className="atp-kv" key={c.id}>
                  <strong>{c.name}</strong>
                  {c.issuer ? `, ${c.issuer}` : ""}
                  {c.year ? <span className="atp-cert-year"> ({c.year})</span> : null}
                </div>
              ))}
            </>
          )}

          {resume.awards.length > 0 && (
            <>
              <h2 className="atp-h2">Awards</h2>
              {resume.awards.map((a) => (
                <div className="atp-kv" key={a.id}>
                  <strong>{a.title}</strong>
                  {a.year ? <span className="atp-cert-year"> ({a.year})</span> : null}
                  {a.detail ? ` — ${a.detail}` : ""}
                </div>
              ))}
            </>
          )}

          {resume.languages.length > 0 && (
            <>
              <h2 className="atp-h2">Languages</h2>
              <div className="atp-kv">
                {resume.languages
                  .map((l) => (l.level ? `${l.name} (${l.level})` : l.name))
                  .join(", ")}
              </div>
            </>
          )}

          {resume.tools.length > 0 && (
            <>
              <h2 className="atp-h2">{resume.toolsLabel?.trim() || "Tools"}</h2>
              <div className="atp-kv">{resume.tools.join(", ")}</div>
            </>
          )}

          {resume.interests.length > 0 && (
            <>
              <h2 className="atp-h2">{resume.interestsLabel?.trim() || "Interests"}</h2>
              <div className="atp-kv">{resume.interests.join(", ")}</div>
            </>
          )}

          {resume.extras.length > 0 && (
            <>
              <h2 className="atp-h2">Additional Information</h2>
              {resume.extras.map((x) => (
                <div className="atp-kv" key={x.id}>
                  <strong>{x.label}:</strong> {x.value}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
