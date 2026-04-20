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
 */

import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { splitSkills } from "./shared.tsx";
import { RichText } from "../utils/richText.tsx";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export function AtsPlain({ resume }: Props) {
  const css = `
    .ats-root { font-family: Arial, Helvetica, 'Liberation Sans', sans-serif; color: #000; font-size: 10.5pt; line-height: 1.45; }
    .ats-page { padding: 14mm 15mm; }
    .ats-name { font-size: 20pt; font-weight: 700; margin: 0; letter-spacing: 0.5px; color: #000; }
    .ats-title { font-size: 11pt; margin: 1mm 0 2mm; color: #000; }
    .ats-contact { font-size: 10pt; color: #000; margin-bottom: 4mm; }
    .ats-contact span + span::before { content: " | "; color: #000; }
    .ats-hr { border: 0; border-top: 1px solid #000; margin: 3mm 0 4mm; }
    .ats-h2 { font-size: 11.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #000; margin: 5mm 0 2mm; border-bottom: 1px solid #000; padding-bottom: 1mm; }
    .ats-h2:first-of-type { margin-top: 2mm; }
    .ats-p { font-size: 10.5pt; color: #000; margin: 0 0 2mm; }
    .ats-job, .ats-edu, .ats-proj, .ats-cert, .ats-award { margin-bottom: 3.5mm; page-break-inside: avoid; }
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

  return (
    <div className="ats-root">
      <style>{css}</style>
      <div className="resume-page">
        <div className="ats-page">
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

          {resume.profile.summary && (
            <>
              <h2 className="ats-h2">Summary</h2>
              <p className="ats-p">
                <RichText value={resume.profile.summary} />
              </p>
            </>
          )}

          {resume.skills.length > 0 && (
            <>
              <h2 className="ats-h2">Skills</h2>
              {resume.skills.map((g) => (
                <div className="ats-skill-row" key={g.id}>
                  <span className="ats-strong">{g.label}:</span>
                  <span>{splitSkills(g.items).join(", ")}</span>
                </div>
              ))}
            </>
          )}

          {resume.experience.length > 0 && (
            <>
              <h2 className="ats-h2">Experience</h2>
              {resume.experience.map((job) => (
                <div className="ats-job" key={job.id}>
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
              <h2 className="ats-h2">Projects</h2>
              {resume.projects.map((p) => (
                <div className="ats-proj" key={p.id}>
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
                </div>
              ))}
            </>
          )}

          {resume.education.length > 0 && (
            <>
              <h2 className="ats-h2">Education</h2>
              {resume.education.map((ed) => (
                <div className="ats-edu" key={ed.id}>
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
                </div>
              ))}
            </>
          )}

          {resume.certifications.length > 0 && (
            <>
              <h2 className="ats-h2">Certifications</h2>
              {resume.certifications.map((c) => (
                <div className="ats-cert" key={c.id}>
                  <span className="ats-strong">{c.name}</span>
                  {c.issuer ? `, ${c.issuer}` : ""}
                  {c.year ? ` (${c.year})` : ""}
                </div>
              ))}
            </>
          )}

          {resume.awards.length > 0 && (
            <>
              <h2 className="ats-h2">Awards</h2>
              {resume.awards.map((a) => (
                <div className="ats-award" key={a.id}>
                  <span className="ats-strong">{a.title}</span>
                  {a.year ? ` (${a.year})` : ""}
                  {a.detail ? ` — ${a.detail}` : ""}
                </div>
              ))}
            </>
          )}

          {resume.languages.length > 0 && (
            <>
              <h2 className="ats-h2">Languages</h2>
              <div className="ats-kv">
                {resume.languages
                  .map((l) => (l.level ? `${l.name} (${l.level})` : l.name))
                  .join(", ")}
              </div>
            </>
          )}

          {resume.tools.length > 0 && (
            <>
              <h2 className="ats-h2">{resume.toolsLabel?.trim() || "Tools"}</h2>
              <div className="ats-kv">{resume.tools.join(", ")}</div>
            </>
          )}

          {resume.interests.length > 0 && (
            <>
              <h2 className="ats-h2">{resume.interestsLabel?.trim() || "Interests"}</h2>
              <div className="ats-kv">{resume.interests.join(", ")}</div>
            </>
          )}

          {resume.extras.length > 0 && (
            <>
              <h2 className="ats-h2">Additional Information</h2>
              {resume.extras.map((x) => (
                <div className="ats-kv" key={x.id}>
                  <span className="ats-strong">{x.label}: </span>
                  {x.value}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
