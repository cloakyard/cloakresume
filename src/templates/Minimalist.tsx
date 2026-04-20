/**
 * Minimalist template.
 *
 * An elegant, understated single-column layout. Everything is type:
 * generous line-height, a single hairline rule under the name, dash
 * bullets, and no colour blocks or chips. Uses the accent only for the
 * name underline and section markers so it still feels on-brand in
 * print. Different from AtsPlain (which is utilitarian) — this one aims
 * for quiet confidence.
 */

import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { splitSkills } from "./shared.tsx";
import { RichText } from "../utils/richText.tsx";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export function Minimalist({ resume, palette }: Props) {
  const css = `
    .ml-root { font-family: 'Geist', 'Inter', sans-serif; color: #1a1a1a; font-size: 9.8pt; line-height: 1.6; padding: 18mm 20mm; }
    .ml-head { margin-bottom: 8mm; }
    .ml-name { font-size: 24pt; font-weight: 500; color: #0a0a0a; letter-spacing: -0.6px; margin: 0; line-height: 1.05; }
    .ml-title { font-size: 10.5pt; color: #525252; margin-top: 2mm; font-weight: 400; letter-spacing: 0.2px; }
    .ml-rule { height: 1px; background: ${palette.primary600}; width: 14mm; margin: 4mm 0 4mm; }
    .ml-contact { font-size: 9pt; color: #525252; letter-spacing: 0.1px; }
    .ml-contact span + span::before { content: " · "; color: #a3a3a3; margin: 0 0.5mm; }
    .ml-section { margin-bottom: 6mm; page-break-inside: avoid; }
    .ml-h2 { font-size: 8.8pt; text-transform: uppercase; letter-spacing: 2.4px; color: #0a0a0a; font-weight: 600; margin: 0 0 3.5mm; }
    .ml-h2::before { content: "§"; color: ${palette.primary600}; font-weight: 400; margin-right: 2mm; letter-spacing: 0; }
    .ml-summary { font-size: 10pt; line-height: 1.7; color: #262626; max-width: 168mm; }
    .ml-job { margin-bottom: 4.5mm; page-break-inside: avoid; }
    .ml-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; margin-bottom: 0.5mm; }
    .ml-jobtitle { font-size: 10.4pt; font-weight: 600; color: #0a0a0a; }
    .ml-jobmeta { font-size: 9pt; color: #737373; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .ml-jobco { font-size: 9.6pt; color: #525252; margin-bottom: 1.8mm; font-style: italic; }
    .ml-job ul { list-style: none; padding: 0; margin: 0; }
    .ml-job li { font-size: 9.6pt; line-height: 1.55; padding-left: 4.5mm; position: relative; margin-bottom: 1mm; color: #262626; }
    .ml-job li::before { content: "—"; position: absolute; left: 0; color: #a3a3a3; }
    .ml-skill { display: grid; grid-template-columns: 36mm 1fr; gap: 4mm; margin-bottom: 1.4mm; font-size: 9.6pt; }
    .ml-skill-label { color: #0a0a0a; font-weight: 600; }
    .ml-skill-list { color: #262626; }
    .ml-edu, .ml-proj { margin-bottom: 3mm; page-break-inside: avoid; }
    .ml-edu-head, .ml-proj-head { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; }
    .ml-edu-title, .ml-proj-name { font-size: 10pt; font-weight: 600; color: #0a0a0a; }
    .ml-edu-school { font-size: 9.4pt; color: #525252; font-style: italic; }
    .ml-edu-meta, .ml-proj-meta { font-size: 9pt; color: #737373; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .ml-proj-desc { font-size: 9.4pt; color: #262626; margin-top: 0.8mm; line-height: 1.55; }
    .ml-proj-stack { font-size: 8.8pt; color: #737373; margin-top: 0.8mm; font-style: italic; }
    .ml-inline { font-size: 9.6pt; color: #262626; }
    .ml-inline strong { color: #0a0a0a; font-weight: 600; }
    .ml-inline span + span::before { content: " · "; color: #a3a3a3; margin: 0 0.5mm; }
  `;

  return (
    <div className="resume-page">
      <div className="ml-root">
        <style>{css}</style>

        <header className="ml-head">
          <h1 className="ml-name">{resume.profile.name}</h1>
          {resume.profile.title && <div className="ml-title">{resume.profile.title}</div>}
          <div className="ml-rule" />
          {resume.contact.length > 0 && (
            <div className="ml-contact">
              {resume.contact.map((c) => (
                <span key={c.id}>{c.value}</span>
              ))}
            </div>
          )}
        </header>

        {resume.profile.summary && (
          <section className="ml-section">
            <h2 className="ml-h2">About</h2>
            <p className="ml-summary">
              <RichText value={resume.profile.summary} />
            </p>
          </section>
        )}

        {resume.experience.length > 0 && (
          <section className="ml-section">
            <h2 className="ml-h2">Experience</h2>
            {resume.experience.map((job) => (
              <div className="ml-job" key={job.id}>
                <div className="ml-jobhead">
                  <div className="ml-jobtitle">{job.title}</div>
                  <div className="ml-jobmeta">
                    {job.start}
                    {job.end ? ` – ${job.end}` : ""}
                  </div>
                </div>
                <div className="ml-jobco">
                  {job.company}
                  {job.location ? `, ${job.location}` : ""}
                </div>
                {job.bullets.length > 0 && (
                  <ul>
                    {job.bullets.map((b, i) => (
                      <li key={`${job.id}-b-${i}`}>
                        <RichText value={b} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {resume.skills.length > 0 && (
          <section className="ml-section">
            <h2 className="ml-h2">Skills</h2>
            {resume.skills.map((g) => (
              <div className="ml-skill" key={g.id}>
                <div className="ml-skill-label">{g.label}</div>
                <div className="ml-skill-list">{splitSkills(g.items).join(", ")}</div>
              </div>
            ))}
          </section>
        )}

        {resume.projects.length > 0 && (
          <section className="ml-section">
            <h2 className="ml-h2">Projects</h2>
            {resume.projects.map((p) => (
              <div className="ml-proj" key={p.id}>
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
              </div>
            ))}
          </section>
        )}

        {resume.education.length > 0 && (
          <section className="ml-section">
            <h2 className="ml-h2">Education</h2>
            {resume.education.map((ed) => (
              <div className="ml-edu" key={ed.id}>
                <div className="ml-edu-head">
                  <div className="ml-edu-title">{ed.degree}</div>
                  <div className="ml-edu-meta">
                    {ed.start}
                    {ed.end ? ` – ${ed.end}` : ""}
                  </div>
                </div>
                <div className="ml-edu-school">
                  {ed.school}
                  {ed.location ? `, ${ed.location}` : ""}
                  {ed.detail ? ` · ${ed.detail}` : ""}
                </div>
              </div>
            ))}
          </section>
        )}

        {resume.certifications.length > 0 && (
          <section className="ml-section">
            <h2 className="ml-h2">Certifications</h2>
            <div className="ml-inline">
              {resume.certifications.map((c) => (
                <span key={c.id}>
                  <strong>{c.name}</strong>
                  {c.issuer ? ` — ${c.issuer}` : ""}
                  {c.year ? ` (${c.year})` : ""}
                </span>
              ))}
            </div>
          </section>
        )}

        {resume.awards.length > 0 && (
          <section className="ml-section">
            <h2 className="ml-h2">Awards</h2>
            <div className="ml-inline">
              {resume.awards.map((a) => (
                <span key={a.id}>
                  <strong>{a.title}</strong>
                  {a.year ? ` (${a.year})` : ""}
                  {a.detail ? ` — ${a.detail}` : ""}
                </span>
              ))}
            </div>
          </section>
        )}

        {resume.languages.length > 0 && (
          <section className="ml-section">
            <h2 className="ml-h2">Languages</h2>
            <div className="ml-inline">
              {resume.languages.map((l) => (
                <span key={l.id}>
                  <strong>{l.name}</strong>
                  {l.level ? ` — ${l.level}` : ""}
                </span>
              ))}
            </div>
          </section>
        )}

        {(resume.interests.length > 0 || resume.tools.length > 0 || resume.extras.length > 0) && (
          <section className="ml-section">
            {resume.tools.length > 0 && (
              <>
                <h2 className="ml-h2">{resume.toolsLabel?.trim() || "Tools"}</h2>
                <div className="ml-inline" style={{ marginBottom: "3mm" }}>
                  {resume.tools.join(" · ")}
                </div>
              </>
            )}
            {resume.interests.length > 0 && (
              <>
                <h2 className="ml-h2">{resume.interestsLabel?.trim() || "Interests"}</h2>
                <div className="ml-inline" style={{ marginBottom: "3mm" }}>
                  {resume.interests.join(" · ")}
                </div>
              </>
            )}
            {resume.extras.length > 0 &&
              resume.extras.map((x) => (
                <div className="ml-inline" key={x.id} style={{ marginBottom: "1.2mm" }}>
                  <strong>{x.label}:</strong> {x.value}
                </div>
              ))}
          </section>
        )}
      </div>
    </div>
  );
}
