/**
 * Classic Sidebar template.
 *
 * Two-page layout faithful to the reference HTML: a tinted left-hand
 * sidebar carries the profile, contact details, and skill chips while
 * the main column owns the summary, experience, education, and
 * projects. All colours are driven by the `PrimaryPalette` so the same
 * layout can adapt to any brand.
 */

import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import {
  certificationLink,
  contactIcon,
  formatDateRange,
  formatLocation,
  renderContactValue,
  splitSkills,
} from "./shared.tsx";
import { RichText } from "../utils/richText.tsx";
import { findLogoIcon } from "../utils/logoIcons.ts";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export function ClassicSidebar({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const css = `
    .cs-root { font-family: 'Geist', 'Inter', sans-serif; color: #1f2937; font-size: 9.2pt; line-height: 1.4; }
    .cs-page { display: grid; grid-template-columns: 68mm 1fr; min-height: 297mm; }
    .cs-sidebar { background: ${palette.primary50}; padding: 12mm 7mm; color: #1f2937; }
    .cs-main { padding: 10mm 10mm 8mm 10mm; }
    .cs-photo { width: 28mm; height: 28mm; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto 4mm; border: 2px solid ${palette.primary600}; }
    .cs-logo { width: 14mm; height: 14mm; border-radius: 4mm; background: ${palette.primary600}; color: ${palette.primaryText}; display: flex; align-items: center; justify-content: center; margin: 0 auto 3mm; }
    .cs-name { font-size: 17pt; font-weight: 700; color: #111827; line-height: 1.1; text-align: center; letter-spacing: 0.3px; }
    .cs-role { font-size: 9.5pt; color: ${palette.primary600}; font-weight: 600; margin-top: 3mm; letter-spacing: 0.5px; text-transform: uppercase; text-align: center; }
    .cs-divider { height: 2px; background: ${palette.primary600}; width: 18mm; margin: 5mm auto 6mm; border-radius: 2px; }
    .cs-h3 { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 1.1px; color: ${palette.primary600}; margin-top: 4mm; margin-bottom: 1.8mm; font-weight: 700; border-bottom: 1px solid ${palette.primary200}; padding-bottom: 1mm; }
    .cs-h3.first { margin-top: 0; }
    .cs-contact { display: flex; align-items: center; gap: 2mm; margin-bottom: 1.4mm; font-size: 8.1pt; word-break: break-word; }
    .cs-contact .i { color: ${palette.primary600}; display: inline-flex; width: 5mm; justify-content: center; }
    .cs-skill-group { margin-bottom: 2mm; }
    .cs-skill-label { font-size: 8pt; font-weight: 700; color: #111827; margin-bottom: 0.5mm; display: flex; align-items: center; gap: 1.5mm; }
    .cs-skill-icon { width: 1em; height: 1em; color: ${palette.primary600}; flex-shrink: 0; }
    .cs-skill-list { font-size: 7.8pt; color: #1e293b; line-height: 1.4; }
    .cs-main h2 { font-size: 10.5pt; color: #27272a; text-transform: uppercase; letter-spacing: 1.3px; font-weight: 700; margin: 0 0 2.5mm; padding-bottom: 1mm; border-bottom: 2px solid #27272a; position: relative; break-after: avoid; page-break-after: avoid; }
    .cs-main h2::after { content: ""; position: absolute; left: 0; bottom: -2px; width: 12mm; height: 2px; background: ${palette.primary600}; }
    .cs-section { margin-bottom: 3.5mm; }
    .cs-summary { font-size: 9pt; line-height: 1.55; color: #1e293b; text-align: justify; }
    .cs-job { margin-bottom: 2.8mm; page-break-inside: avoid; break-inside: avoid; }
    .cs-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; }
    .cs-jobtitle { font-size: 9.6pt; font-weight: 700; color: #27272a; }
    .cs-jobmeta { font-size: 8.2pt; color: #6b7280; font-style: italic; white-space: nowrap; }
    .cs-jobco { font-size: 8.8pt; color: ${palette.primary600}; font-weight: 600; margin-bottom: 1.2mm; }
    .cs-job ul { list-style: none; padding: 0; margin: 0; }
    .cs-job li { font-size: 8.7pt; line-height: 1.45; padding-left: 4mm; position: relative; margin-bottom: 0.8mm; }
    .cs-job li::before { content: "▸"; position: absolute; left: 0; color: ${palette.primary600}; font-weight: 700; }
    .cs-edu { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.5mm; page-break-inside: avoid; break-inside: avoid; }
    .cs-edutitle { font-size: 9.4pt; font-weight: 700; color: #27272a; }
    .cs-eduschool { font-size: 8.8pt; color: ${palette.primary600}; font-weight: 600; }
    .cs-edumeta { font-size: 8.4pt; color: #6b7280; font-style: italic; }
    .cs-proj-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.8mm; }
    .cs-proj { border: 1px solid #e5e7eb; border-left: 3px solid ${palette.primary600}; border-radius: 3px; padding: 2mm 2.5mm; background: #fafbfc; page-break-inside: avoid; break-inside: avoid; }
    .cs-projname { font-size: 8.8pt; font-weight: 700; color: #27272a; margin-bottom: 0.8mm; }
    .cs-projdesc { font-size: 7.9pt; color: #4b5563; line-height: 1.4; margin-bottom: 1.2mm; }
    .cs-projrole { font-size: 7.8pt; color: #27272a; line-height: 1.4; margin-bottom: 1.2mm; }
    .cs-chips { display: flex; flex-wrap: wrap; gap: 1mm; }
    .cs-chip { background: ${palette.primary50}; border: 1px solid ${palette.primary200}; color: ${palette.primary900}; padding: 0.2mm 1.4mm; border-radius: 6px; font-size: 7.2pt; font-weight: 600; }
    .cs-cert { font-size: 8.2pt; margin-bottom: 1.6mm; }
    .cs-cert strong { color: #111827; display: block; }
    .cs-award { font-size: 8.2pt; margin-bottom: 1.6mm; }
    .cs-award strong { color: #111827; display: block; }
    .cs-lang { display: flex; justify-content: space-between; font-size: 8.3pt; margin-bottom: 1mm; }
    .cs-lang .lvl { color: ${palette.primary600}; font-size: 7.8pt; }
    .cs-interests { display: flex; flex-wrap: wrap; gap: 1.5mm; }
    .cs-extrakv { font-size: 8.2pt; margin-bottom: 1.5mm; }
    .cs-extrakv strong { color: #111827; display: block; }
    .cs-stats p { line-height: 1.7; font-size: 8.3pt; }
    .cs-stats strong { color: #111827; }
  `;

  const sidebarContactKinds = resume.contact;

  return (
    <>
      <style>{css}</style>

      {/* ───── Page 1 ───── */}
      <div className="resume-page cs-root">
        <div className="cs-page">
          <aside className="cs-sidebar">
            {resume.profile.photoUrl ? (
              <img
                className="cs-photo"
                src={resume.profile.photoUrl}
                alt={resume.profile.name}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : logo ? (
              <div className="cs-logo">
                <logo.Icon style={{ width: "8mm", height: "8mm" }} />
              </div>
            ) : null}
            <div className="cs-name">{resume.profile.name}</div>
            <div className="cs-role">{resume.profile.title}</div>
            <div className="cs-divider" />

            {sidebarContactKinds.length > 0 && (
              <>
                <div className="cs-h3 first">Contact</div>
                {sidebarContactKinds.map((c) => (
                  <div key={c.id} className="cs-contact">
                    <span className="i">{contactIcon(c.kind, 10)}</span>
                    <span>{renderContactValue(c)}</span>
                  </div>
                ))}
              </>
            )}

            {resume.skills.length > 0 && (
              <>
                <div className="cs-h3">Core Expertise</div>
                {resume.skills.map((group) => {
                  const GroupIcon = findLogoIcon(group.iconName)?.Icon;
                  return (
                    <div className="cs-skill-group" key={group.id}>
                      <div className="cs-skill-label">
                        {GroupIcon && <GroupIcon className="cs-skill-icon" />}
                        <span>{group.label}</span>
                      </div>
                      <div className="cs-skill-list">{splitSkills(group.items).join(", ")}</div>
                    </div>
                  );
                })}
              </>
            )}
          </aside>

          <main className="cs-main">
            {resume.profile.summary && (
              <section className="cs-section">
                <h2>Professional Summary</h2>
                <p className="cs-summary">
                  <RichText value={resume.profile.summary} />
                </p>
              </section>
            )}

            {resume.experience.length > 0 && (
              <section className="cs-section">
                <h2>Work Experience</h2>
                {resume.experience.map((job) => (
                  <div className="cs-job" key={job.id}>
                    <div className="cs-jobhead">
                      <div className="cs-jobtitle">{job.title}</div>
                      <div className="cs-jobmeta">
                        {formatDateRange(job.start, job.end)}
                        {formatLocation(job.location, " · ")}
                      </div>
                    </div>
                    <div className="cs-jobco">{job.company}</div>
                    <ul>
                      {job.bullets.map((b, i) => (
                        <li key={`${job.id}-bullet-${i}`}>
                          <RichText value={b} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}

            {resume.education.length > 0 && (
              <section className="cs-section">
                <h2>Education</h2>
                {resume.education.map((ed) => (
                  <div className="cs-edu" key={ed.id}>
                    <div>
                      <div className="cs-edutitle">{ed.degree}</div>
                      <div className="cs-eduschool">
                        {ed.school}
                        {formatLocation(ed.location)}
                      </div>
                    </div>
                    <div className="cs-edumeta">
                      {formatDateRange(ed.start, ed.end)}
                      {ed.detail ? ` · ${ed.detail}` : ""}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </main>
        </div>
      </div>

      {/* ───── Page 2 ───── */}
      <div className="resume-page cs-root">
        <div className="cs-page">
          <aside className="cs-sidebar">
            {resume.certifications.length > 0 && (
              <>
                <div className="cs-h3 first">Certifications</div>
                {resume.certifications.map((c) => (
                  <div className="cs-cert" key={c.id}>
                    {certificationLink(
                      c,
                      <>
                        <strong>{c.issuer}</strong>
                        {c.name}
                      </>,
                    )}
                    {c.year ? ` (${c.year})` : ""}
                  </div>
                ))}
              </>
            )}

            {resume.awards.length > 0 && (
              <>
                <div className="cs-h3">Honors & Awards</div>
                {resume.awards.map((a) => (
                  <div className="cs-award" key={a.id}>
                    <strong>
                      {a.title}
                      {a.year ? ` · ${a.year}` : ""}
                    </strong>
                    {a.detail}
                  </div>
                ))}
              </>
            )}

            {resume.languages.length > 0 && (
              <>
                <div className="cs-h3">Languages</div>
                {resume.languages.map((l) => (
                  <div className="cs-lang" key={l.id}>
                    <span>{l.name}</span>
                    <span className="lvl">{l.level}</span>
                  </div>
                ))}
              </>
            )}

            {resume.tools.length > 0 && (
              <>
                <div className="cs-h3">{resume.toolsLabel?.trim() || "Tools I Use"}</div>
                <div className="cs-interests">
                  {resume.tools.map((t, i) => (
                    <span className="cs-chip" key={i}>
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}

            {resume.interests.length > 0 && (
              <>
                <div className="cs-h3">{resume.interestsLabel?.trim() || "Interests"}</div>
                <div className="cs-interests">
                  {resume.interests.map((t, i) => (
                    <span className="cs-chip" key={i}>
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}

            {resume.quickStats.length > 0 && (
              <>
                <div className="cs-h3">Quick Stats</div>
                <div className="cs-stats">
                  <p>
                    {resume.quickStats.map((s, i) => (
                      <span key={s.id}>
                        <strong>{s.value}</strong> {s.label}
                        {i < resume.quickStats.length - 1 ? <br /> : null}
                      </span>
                    ))}
                  </p>
                </div>
              </>
            )}

            {resume.extras.length > 0 && (
              <>
                <div className="cs-h3">Extras</div>
                {resume.extras.map((x) => (
                  <div className="cs-extrakv" key={x.id}>
                    <strong>{x.label}</strong>
                    {x.value}
                  </div>
                ))}
              </>
            )}
          </aside>

          <main className="cs-main">
            {resume.projects.length > 0 && (
              <section className="cs-section">
                <h2>Key Projects</h2>
                <div className="cs-proj-grid">
                  {resume.projects.map((p) => (
                    <div className="cs-proj" key={p.id}>
                      <div className="cs-projname">{p.name}</div>
                      <div className="cs-projdesc">{p.description}</div>
                      {p.role && <div className="cs-projrole">{p.role}</div>}
                      {p.stack.length > 0 && (
                        <div className="cs-chips">
                          {p.stack.map((s, i) => (
                            <span className="cs-chip" key={i}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {resume.custom
              .filter((c) => c.header.trim() && c.bullets.some((b) => b.trim()))
              .map((c) => (
                <section className="cs-section" key={c.id}>
                  <h2>{c.header}</h2>
                  {c.bullets.length === 1 ? (
                    <p className="cs-summary">
                      <RichText value={c.bullets[0]} />
                    </p>
                  ) : (
                    <div className="cs-job">
                      <ul>
                        {c.bullets.map((b, i) => (
                          // oxlint-disable-next-line jsx/no-array-index-key
                          <li key={`${c.id}-b-${i}`}>
                            <RichText value={b} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              ))}
          </main>
        </div>
      </div>
    </>
  );
}
