/**
 * Compact Timeline template.
 *
 * A two-column layout where the left rail is a compact vertical
 * timeline of experience with connecting dots, and the right column
 * carries everything else. Dense but easy to scan — ideal for highly
 * experienced candidates who want everything on a single page.
 */

import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { contactIcon, splitSkills } from "./shared.tsx";
import { RichText } from "../utils/richText.tsx";
import { findLogoIcon } from "../utils/logoIcons.ts";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export function CompactTimeline({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const css = `
    .ct-root { font-family: 'Geist', 'Inter', sans-serif; color: #1f2937; font-size: 9.1pt; line-height: 1.4; padding: 12mm 12mm; display: grid; grid-template-columns: 98mm 1fr; gap: 8mm; min-height: 297mm; }
    .ct-left { position: relative; }
    .ct-right { }
    .ct-head { border-bottom: 2px solid ${palette.primary600}; padding-bottom: 3mm; margin-bottom: 4mm; display: flex; align-items: center; gap: 4mm; }
    .ct-head-body { flex: 1; }
    .ct-logo { width: 14mm; height: 14mm; border-radius: 3mm; background: ${palette.primary600}; color: ${palette.primaryText}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ct-name { font-size: 19pt; font-weight: 700; color: #111827; letter-spacing: -0.2px; line-height: 1.05; }
    .ct-title { font-size: 9.5pt; color: ${palette.primary600}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1.5mm; }
    .ct-contact { margin-top: 3mm; display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 3mm; font-size: 8.2pt; color: #1e293b; }
    .ct-contact span { display: inline-flex; align-items: center; gap: 1.2mm; word-break: break-word; }
    .ct-contact svg { color: ${palette.primary600}; flex-shrink: 0; }
    .ct-h2 { font-size: 9.2pt; text-transform: uppercase; letter-spacing: 1.3px; color: ${palette.primary700}; font-weight: 700; margin: 4mm 0 2mm; padding-bottom: 1mm; border-bottom: 1px solid ${palette.primary200}; }
    .ct-section { margin-bottom: 3.5mm; }
    .ct-summary { font-size: 8.8pt; line-height: 1.5; color: #1e293b; text-align: justify; }
    .ct-tl { position: relative; padding-left: 5mm; border-left: 1.5px solid ${palette.primary200}; }
    .ct-tl-item { position: relative; padding-bottom: 3mm; page-break-inside: avoid; }
    .ct-tl-item:last-child { padding-bottom: 0; }
    .ct-tl-item::before { content: ""; position: absolute; left: -6.6mm; top: 1.2mm; width: 2.4mm; height: 2.4mm; background: ${palette.primary600}; border-radius: 50%; border: 1.5px solid #ffffff; box-shadow: 0 0 0 1px ${palette.primary200}; }
    .ct-role { font-size: 9.4pt; font-weight: 700; color: #111827; }
    .ct-co { font-size: 8.6pt; color: ${palette.primary700}; font-weight: 600; }
    .ct-dates { font-size: 7.8pt; color: #6b7280; font-style: italic; margin-top: 0.3mm; margin-bottom: 1mm; }
    .ct-tl-item ul { list-style: none; padding: 0; margin: 0; }
    .ct-tl-item li { font-size: 8.4pt; line-height: 1.42; padding-left: 3mm; position: relative; margin-bottom: 0.5mm; color: #27272a; }
    .ct-tl-item li::before { content: "•"; position: absolute; left: 0; color: ${palette.primary600}; font-weight: 700; }
    .ct-skill-group { margin-bottom: 1.4mm; font-size: 8.4pt; }
    .ct-skill-label { color: #111827; font-weight: 700; }
    .ct-skill-list { color: #27272a; line-height: 1.4; }
    .ct-proj { border-left: 2px solid ${palette.primary600}; background: ${palette.primary50}; border-radius: 2px; padding: 1.6mm 2.4mm; margin-bottom: 2mm; page-break-inside: avoid; }
    .ct-projname { font-size: 8.8pt; font-weight: 700; color: #111827; margin-bottom: 0.6mm; }
    .ct-projdesc { font-size: 7.9pt; color: #4b5563; line-height: 1.38; margin-bottom: 0.8mm; }
    .ct-projstack { font-size: 7.4pt; color: ${palette.primary700}; font-weight: 600; }
    .ct-edu { margin-bottom: 1.5mm; font-size: 8.6pt; }
    .ct-edutitle { font-weight: 700; color: #111827; }
    .ct-eduschool { color: ${palette.primary700}; font-weight: 600; }
    .ct-edumeta { color: #6b7280; font-size: 8pt; font-style: italic; }
    .ct-kv { font-size: 8.3pt; margin-bottom: 0.8mm; }
    .ct-kv strong { color: #111827; }
    .ct-pill { display: inline-block; background: ${palette.primary50}; border: 1px solid ${palette.primary200}; color: ${palette.primary900}; padding: 0.3mm 1.5mm; margin: 0.3mm; border-radius: 4px; font-size: 7.4pt; font-weight: 600; }
    .ct-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 3mm; }
    .ct-lang { display: flex; justify-content: space-between; font-size: 8.2pt; }
    .ct-lang .lvl { color: ${palette.primary600}; font-size: 7.6pt; }
  `;

  return (
    <div className="resume-page">
      <div className="ct-root">
        <style>{css}</style>

        {/* ── Left rail ── */}
        <div className="ct-left">
          <header className="ct-head">
            {logo && (
              <div className="ct-logo">
                <logo.Icon style={{ width: "8mm", height: "8mm" }} />
              </div>
            )}
            <div className="ct-head-body">
              <div className="ct-name">{resume.profile.name}</div>
              <div className="ct-title">{resume.profile.title}</div>
              <div className="ct-contact">
                {resume.contact.map((c) => (
                  <span key={c.id}>
                    {contactIcon(c.kind, 10)}
                    <span>{c.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </header>

          {resume.profile.summary && (
            <section className="ct-section">
              <div className="ct-h2">Summary</div>
              <p className="ct-summary">
                <RichText value={resume.profile.summary} />
              </p>
            </section>
          )}

          {resume.experience.length > 0 && (
            <section className="ct-section">
              <div className="ct-h2">Experience</div>
              <div className="ct-tl">
                {resume.experience.map((job) => (
                  <div className="ct-tl-item" key={job.id}>
                    <div className="ct-role">{job.title}</div>
                    <div className="ct-co">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""}
                    </div>
                    <div className="ct-dates">
                      {job.start}
                      {job.end ? ` – ${job.end}` : ""}
                    </div>
                    <ul>
                      {job.bullets.map((b, i) => (
                        <li key={`${job.id}-b-${i}`}>
                          <RichText value={b} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="ct-right">
          {resume.skills.length > 0 && (
            <section className="ct-section">
              <div className="ct-h2">Skills</div>
              {resume.skills.map((g) => (
                <div className="ct-skill-group" key={g.id}>
                  <span className="ct-skill-label">{g.label}: </span>
                  <span className="ct-skill-list">{splitSkills(g.items).join(", ")}</span>
                </div>
              ))}
            </section>
          )}

          {resume.projects.length > 0 && (
            <section className="ct-section">
              <div className="ct-h2">Projects</div>
              {resume.projects.map((p) => (
                <div className="ct-proj" key={p.id}>
                  <div className="ct-projname">{p.name}</div>
                  <div className="ct-projdesc">
                    {p.description}
                    {p.role ? ` ${p.role}` : ""}
                  </div>
                  {p.stack.length > 0 && <div className="ct-projstack">{p.stack.join(" · ")}</div>}
                </div>
              ))}
            </section>
          )}

          {resume.education.length > 0 && (
            <section className="ct-section">
              <div className="ct-h2">Education</div>
              {resume.education.map((ed) => (
                <div className="ct-edu" key={ed.id}>
                  <span className="ct-edutitle">{ed.degree}</span> ·{" "}
                  <span className="ct-eduschool">{ed.school}</span>
                  <span className="ct-edumeta">
                    {" "}
                    · {ed.start}
                    {ed.end ? ` – ${ed.end}` : ""}
                    {ed.detail ? ` · ${ed.detail}` : ""}
                  </span>
                </div>
              ))}
            </section>
          )}

          <div className="ct-mini-grid">
            {resume.certifications.length > 0 && (
              <section>
                <div className="ct-h2">Certifications</div>
                {resume.certifications.map((c) => (
                  <div className="ct-kv" key={c.id}>
                    <strong>{c.name}</strong>
                    <br />
                    {c.issuer}
                    {c.year ? ` · ${c.year}` : ""}
                  </div>
                ))}
              </section>
            )}
            {resume.awards.length > 0 && (
              <section>
                <div className="ct-h2">Awards</div>
                {resume.awards.map((a) => (
                  <div className="ct-kv" key={a.id}>
                    <strong>{a.title}</strong>
                    {a.year ? ` · ${a.year}` : ""}
                    {a.detail ? <span> — {a.detail}</span> : null}
                  </div>
                ))}
              </section>
            )}
          </div>

          {(resume.languages.length > 0 ||
            resume.interests.length > 0 ||
            resume.tools.length > 0 ||
            resume.extras.length > 0) && (
            <section className="ct-section">
              <div className="ct-h2">More</div>
              {resume.languages.length > 0 && (
                <div style={{ marginBottom: "1.5mm" }}>
                  {resume.languages.map((l) => (
                    <div className="ct-lang" key={l.id}>
                      <span>{l.name}</span>
                      <span className="lvl">{l.level}</span>
                    </div>
                  ))}
                </div>
              )}
              {resume.tools.length > 0 && (
                <div style={{ marginBottom: "1mm" }}>
                  {resume.tools.map((t, i) => (
                    <span className="ct-pill" key={i}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {resume.interests.length > 0 && (
                <div style={{ marginBottom: "1mm" }}>
                  <strong style={{ fontSize: "8.2pt", color: "#111827" }}>
                    {resume.interestsLabel?.trim() || "Interests"}:{" "}
                  </strong>
                  {resume.interests.join(", ")}
                </div>
              )}
              {resume.extras.map((x) => (
                <div className="ct-kv" key={x.id}>
                  <strong>{x.label}:</strong> {x.value}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
