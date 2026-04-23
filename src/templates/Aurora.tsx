/**
 * Aurora template.
 *
 * Contemporary SaaS/tech aesthetic — a soft mesh-gradient header
 * carrying identity in a frosted-glass card, followed by a clean
 * single-column body. Each section is marked by a small gradient
 * badge; experience blocks sit inside pill-shaped date chips with a
 * subtle accent dot. Projects render as light cards with a tinted
 * top-stripe. The mesh hero appears on page 1 only; additional
 * content flows onto further pages via the shared `PaginatedCanvas`.
 */

import { PaginatedCanvas } from "../components/PaginatedCanvas.tsx";
import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { findLogoIcon } from "../utils/logoIcons.ts";
import { RichText } from "../utils/richText.tsx";
import {
  certificationLink,
  contactIcon,
  extractInitials,
  formatDateRange,
  formatLocation,
  renderContactValue,
  splitSkills,
} from "./shared.tsx";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export function Aurora({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const initials = extractInitials(resume.profile.name);

  const css = `
    .au-root { font-family: 'Geist', 'Inter', sans-serif; color: #1f2937; font-size: 9.4pt; line-height: 1.5; }
    .au-hero { position: relative; padding: 14mm 14mm 10mm; overflow: hidden; margin: -8mm -14mm 6mm;
      background:
        radial-gradient(circle at 12% 18%, ${palette.primary200} 0%, transparent 40%),
        radial-gradient(circle at 88% 10%, ${palette.primary400} 0%, transparent 38%),
        radial-gradient(circle at 75% 95%, ${palette.primary100} 0%, transparent 45%),
        linear-gradient(135deg, ${palette.primary50} 0%, #ffffff 60%, ${palette.primary100} 100%);
      border-bottom: 1px solid ${palette.primary200};
    }
    .au-hero::before { content: ""; position: absolute; inset: 0; background-image:
      linear-gradient(${palette.primary200} 1px, transparent 1px),
      linear-gradient(90deg, ${palette.primary200} 1px, transparent 1px);
      background-size: 12mm 12mm; opacity: 0.18; pointer-events: none; }
    .au-card { position: relative; z-index: 1; display: flex; gap: 6mm; align-items: center; background: rgba(255,255,255,0.72); border: 1px solid ${palette.primary200}; border-radius: 5mm; padding: 6mm 7mm; box-shadow: 0 1mm 4mm rgba(15,23,42,0.04); }
    .au-avatar { width: 22mm; height: 22mm; border-radius: 50%; background: linear-gradient(135deg, ${palette.primary600}, ${palette.primary900}); color: ${palette.primaryText}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14pt; font-weight: 800; letter-spacing: -0.4px; overflow: hidden; border: 2px solid #ffffff; box-shadow: 0 0.5mm 2mm rgba(15,23,42,0.12); }
    .au-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .au-headbody { flex: 1; min-width: 0; }
    .au-name { font-size: 22pt; font-weight: 800; color: #0a0a0a; line-height: 1.05; letter-spacing: -0.6px; margin: 0; }
    .au-title { font-size: 10pt; color: ${palette.primary700}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.8px; margin-top: 1.6mm; }
    .au-contact { display: flex; flex-wrap: wrap; gap: 1.5mm 4mm; margin-top: 3.5mm; font-size: 8.6pt; color: #374151; }
    .au-contact span { display: inline-flex; align-items: center; gap: 1.4mm; }
    .au-contact svg { color: ${palette.primary600}; }

    .au-h2 { display: inline-flex; align-items: center; gap: 2.5mm; font-size: 8.8pt; text-transform: uppercase; letter-spacing: 2px; color: ${palette.primary900}; font-weight: 800; margin: 6mm 0 3mm; padding: 1.2mm 3mm; background: linear-gradient(135deg, ${palette.primary50}, ${palette.primary100}); border: 1px solid ${palette.primary200}; border-radius: 999px; break-after: avoid; page-break-after: avoid; }
    .au-h2::before { content: ""; width: 2.2mm; height: 2.2mm; border-radius: 50%; background: linear-gradient(135deg, ${palette.primary600}, ${palette.primary900}); flex-shrink: 0; }

    .au-summary { font-size: 9.6pt; line-height: 1.62; color: #1e293b; }

    .au-job { position: relative; padding: 0 0 3.5mm 7mm; margin-bottom: 2.5mm; page-break-inside: avoid; break-inside: avoid; }
    .au-job::before { content: ""; position: absolute; left: 0; top: 2.5mm; bottom: 0.5mm; width: 2px; background: linear-gradient(180deg, ${palette.primary400}, ${palette.primary200}); border-radius: 2px; }
    .au-job::after { content: ""; position: absolute; left: -1.6mm; top: 1.8mm; width: 5mm; height: 5mm; background: #ffffff; border: 2px solid ${palette.primary600}; border-radius: 50%; box-shadow: 0 0 0 2mm ${palette.primary50}; }
    .au-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; margin-bottom: 0.8mm; }
    .au-jobtitle { font-size: 10.4pt; font-weight: 700; color: #0a0a0a; letter-spacing: -0.15px; }
    .au-jobchip { font-size: 8pt; color: ${palette.primary900}; background: ${palette.primary50}; border: 1px solid ${palette.primary200}; padding: 0.4mm 2.4mm; border-radius: 999px; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .au-jobco { font-size: 9.2pt; color: ${palette.primary700}; font-weight: 700; margin-bottom: 1.4mm; }
    .au-jobco .loc { color: #6b7280; font-weight: 500; }
    .au-job ul { list-style: none; padding: 0; margin: 0; }
    .au-job li { font-size: 9pt; line-height: 1.5; padding-left: 4.5mm; position: relative; margin-bottom: 0.8mm; color: #1f2937; }
    .au-job li::before { content: ""; position: absolute; left: 0; top: 1.8mm; width: 2.2mm; height: 2.2mm; background: linear-gradient(135deg, ${palette.primary400}, ${palette.primary700}); border-radius: 50%; }

    .au-skills { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 5mm; }
    .au-skill { background: #fafbfc; border: 1px solid #e5e7eb; border-left: 3px solid ${palette.primary600}; border-radius: 3mm; padding: 2.5mm 3mm; page-break-inside: avoid; break-inside: avoid; }
    .au-skill-label { font-size: 8.8pt; font-weight: 700; color: #0a0a0a; margin-bottom: 1mm; display: flex; align-items: center; gap: 1.8mm; }
    .au-skill-icon { width: 1em; height: 1em; color: ${palette.primary600}; flex-shrink: 0; }
    .au-skill-chips { display: flex; flex-wrap: wrap; gap: 1.2mm; }
    .au-skill-chip { background: #ffffff; border: 1px solid ${palette.primary200}; color: ${palette.primary900}; padding: 0.3mm 1.8mm; border-radius: 999px; font-size: 7.6pt; font-weight: 600; }

    .au-proj { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
    .au-proj-card { position: relative; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 3mm; padding: 3mm 3mm 2.5mm; page-break-inside: avoid; break-inside: avoid; overflow: hidden; }
    .au-proj-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2mm; background: linear-gradient(90deg, ${palette.primary600}, ${palette.primary300}, ${palette.primary900}); }
    .au-proj-name { font-size: 9.6pt; font-weight: 700; color: #0a0a0a; margin-top: 1.6mm; }
    .au-proj-role { font-size: 8.2pt; color: ${palette.primary700}; font-weight: 600; margin-top: 0.5mm; }
    .au-proj-desc { font-size: 8.7pt; color: #374151; line-height: 1.45; margin-top: 1.2mm; }
    .au-proj-stack { display: flex; flex-wrap: wrap; gap: 1mm; margin-top: 1.4mm; }
    .au-proj-stackchip { background: ${palette.primary50}; color: ${palette.primary900}; padding: 0.2mm 1.4mm; border-radius: 6px; font-size: 7.4pt; font-weight: 600; border: 1px solid ${palette.primary200}; }

    .au-edu { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; padding: 1.4mm 0; border-bottom: 1px dashed #e5e7eb; page-break-inside: avoid; break-inside: avoid; }
    .au-edu:last-child { border-bottom: 0; }
    .au-edu-title { font-size: 9.6pt; font-weight: 700; color: #0a0a0a; }
    .au-edu-school { font-size: 8.8pt; color: ${palette.primary700}; font-weight: 600; margin-top: 0.4mm; }
    .au-edu-meta { font-size: 8.4pt; color: #6b7280; font-variant-numeric: tabular-nums; white-space: nowrap; text-align: right; }
    .au-edu-detail { font-size: 8.2pt; color: #6b7280; font-style: italic; margin-top: 0.3mm; }

    .au-two { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
    .au-item { font-size: 8.8pt; margin-bottom: 1.4mm; color: #1f2937; line-height: 1.45; }
    .au-item strong { color: #0a0a0a; font-weight: 700; }
    .au-item .meta { color: ${palette.primary700}; font-weight: 600; font-variant-numeric: tabular-nums; }

    .au-chips { display: flex; flex-wrap: wrap; gap: 1.2mm; }
    .au-chip { background: linear-gradient(135deg, ${palette.primary50}, ${palette.primary100}); border: 1px solid ${palette.primary200}; color: ${palette.primary900}; padding: 0.5mm 2mm; border-radius: 999px; font-size: 7.8pt; font-weight: 600; }

    .au-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(28mm, 1fr)); gap: 2.5mm; margin-top: 4mm; }
    .au-stat { background: rgba(255,255,255,0.75); border: 1px solid ${palette.primary200}; border-radius: 3mm; padding: 2.5mm 3mm; text-align: center; }
    .au-stat-value { font-size: 14pt; font-weight: 800; color: ${palette.primary700}; letter-spacing: -0.4px; line-height: 1; }
    .au-stat-label { font-size: 7.4pt; text-transform: uppercase; letter-spacing: 1.2px; color: #6b7280; font-weight: 700; margin-top: 1mm; }

    .au-kv { font-size: 8.6pt; margin-bottom: 1.2mm; color: #1f2937; }
    .au-kv strong { color: #0a0a0a; font-weight: 700; }
  `;

  const atoms: React.ReactNode[] = [];

  atoms.push(
    <header className="au-hero" key="head">
      <div className="au-card">
        <div className="au-avatar">
          {resume.profile.photoUrl ? (
            <img src={resume.profile.photoUrl} alt={resume.profile.name} />
          ) : logo ? (
            <logo.Icon style={{ width: "12mm", height: "12mm" }} />
          ) : (
            initials || "—"
          )}
        </div>
        <div className="au-headbody">
          <h1 className="au-name">{resume.profile.name}</h1>
          {resume.profile.title && <div className="au-title">{resume.profile.title}</div>}
          <div className="au-contact">
            {resume.contact.map((c) => (
              <span key={c.id}>
                {contactIcon(c.kind, 11)}
                {renderContactValue(c)}
              </span>
            ))}
          </div>
        </div>
      </div>
      {resume.quickStats.length > 0 && (
        <div className="au-stats">
          {resume.quickStats.map((s) => (
            <div className="au-stat" key={s.id}>
              <div className="au-stat-value">{s.value}</div>
              <div className="au-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </header>,
  );

  if (resume.profile.summary) {
    atoms.push(
      <h2 className="au-h2" data-keep-with-next="true" key="summary-h">
        About
      </h2>,
      <p className="au-summary" key="summary-p">
        <RichText value={resume.profile.summary} />
      </p>,
    );
  }

  if (resume.experience.length > 0) {
    atoms.push(
      <h2 className="au-h2" data-keep-with-next="true" key="exp-h">
        Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      atoms.push(
        <div className="au-job" key={`exp-${job.id}`}>
          <div className="au-jobhead">
            <div className="au-jobtitle">{job.title}</div>
            <div className="au-jobchip">{formatDateRange(job.start, job.end)}</div>
          </div>
          <div className="au-jobco">
            {job.company}
            {job.location ? <span className="loc"> · {job.location}</span> : null}
          </div>
          {job.bullets.length > 0 && (
            <ul>
              {job.bullets.map((b, i) => (
                // oxlint-disable-next-line jsx/no-array-index-key
                <li key={`${job.id}-b-${i}`}>
                  <RichText value={b} />
                </li>
              ))}
            </ul>
          )}
        </div>,
      );
    });
  }

  // Skills: 2-col grid — kept as a single atom to preserve the layout.
  if (resume.skills.length > 0) {
    atoms.push(
      <div key="skills">
        <h2 className="au-h2">Skills</h2>
        <div className="au-skills">
          {resume.skills.map((g) => {
            const GroupIcon = findLogoIcon(g.iconName)?.Icon;
            return (
              <div className="au-skill" key={g.id}>
                <div className="au-skill-label">
                  {GroupIcon && <GroupIcon className="au-skill-icon" />}
                  <span>{g.label}</span>
                </div>
                <div className="au-skill-chips">
                  {splitSkills(g.items).map((s, i) => (
                    // oxlint-disable-next-line jsx/no-array-index-key
                    <span className="au-skill-chip" key={i}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>,
    );
  }

  // Projects: 2-col grid — kept as a single atom to preserve the layout.
  if (resume.projects.length > 0) {
    atoms.push(
      <div key="proj">
        <h2 className="au-h2">Projects</h2>
        <div className="au-proj">
          {resume.projects.map((p) => (
            <div className="au-proj-card" key={p.id}>
              <div className="au-proj-name">{p.name}</div>
              {p.role && <div className="au-proj-role">{p.role}</div>}
              {p.description && (
                <div className="au-proj-desc">
                  <RichText value={p.description} />
                </div>
              )}
              {p.stack.length > 0 && (
                <div className="au-proj-stack">
                  {p.stack.map((s, i) => (
                    // oxlint-disable-next-line jsx/no-array-index-key
                    <span className="au-proj-stackchip" key={i}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>,
    );
  }

  if (resume.education.length > 0) {
    atoms.push(
      <h2 className="au-h2" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      atoms.push(
        <div className="au-edu" key={`edu-${ed.id}`}>
          <div>
            <div className="au-edu-title">{ed.degree}</div>
            <div className="au-edu-school">
              {ed.school}
              {formatLocation(ed.location)}
            </div>
            {ed.detail && <div className="au-edu-detail">{ed.detail}</div>}
          </div>
          <div className="au-edu-meta">{formatDateRange(ed.start, ed.end)}</div>
        </div>,
      );
    });
  }

  // Credentials: 2-col grid — kept as a single atom.
  if (resume.certifications.length > 0 || resume.awards.length > 0) {
    atoms.push(
      <div className="au-two" key="rec">
        {resume.certifications.length > 0 && (
          <div>
            <h2 className="au-h2">Certifications</h2>
            {resume.certifications.map((c) => (
              <div className="au-item" key={c.id}>
                {certificationLink(c, <strong>{c.name}</strong>)}
                {c.issuer ? ` — ${c.issuer}` : ""}
                {c.year ? <span className="meta"> · {c.year}</span> : null}
              </div>
            ))}
          </div>
        )}
        {resume.awards.length > 0 && (
          <div>
            <h2 className="au-h2">Awards</h2>
            {resume.awards.map((a) => (
              <div className="au-item" key={a.id}>
                <strong>{a.title}</strong>
                {a.detail ? ` — ${a.detail}` : ""}
                {a.year ? <span className="meta"> · {a.year}</span> : null}
              </div>
            ))}
          </div>
        )}
      </div>,
    );
  }

  // Tail (languages/tools/interests/extras): 2-col grid — single atom.
  if (
    resume.languages.length > 0 ||
    resume.tools.length > 0 ||
    resume.interests.length > 0 ||
    resume.extras.length > 0
  ) {
    atoms.push(
      <div className="au-two" key="tail">
        <div>
          {resume.languages.length > 0 && (
            <>
              <h2 className="au-h2">Languages</h2>
              <div className="au-chips">
                {resume.languages.map((l) => (
                  <span className="au-chip" key={l.id}>
                    {l.name}
                    {l.level ? ` · ${l.level}` : ""}
                  </span>
                ))}
              </div>
            </>
          )}
          {resume.tools.length > 0 && (
            <div style={{ marginTop: "3mm" }}>
              <h2 className="au-h2">{resume.toolsLabel?.trim() || "Tools"}</h2>
              <div className="au-chips">
                {resume.tools.map((t, i) => (
                  // oxlint-disable-next-line jsx/no-array-index-key
                  <span className="au-chip" key={i}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          {resume.interests.length > 0 && (
            <>
              <h2 className="au-h2">{resume.interestsLabel?.trim() || "Interests"}</h2>
              <div className="au-chips">
                {resume.interests.map((t, i) => (
                  // oxlint-disable-next-line jsx/no-array-index-key
                  <span className="au-chip" key={i}>
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}
          {resume.extras.length > 0 && (
            <div style={{ marginTop: "3mm" }}>
              {resume.extras.map((x) => (
                <div className="au-kv" key={x.id}>
                  <strong>{x.label}:</strong> {x.value}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>,
    );
  }

  resume.custom
    .filter((c) => c.header.trim() && c.bullets.some((b) => b.trim()))
    .forEach((c) => {
      atoms.push(
        <h2 className="au-h2" data-keep-with-next="true" key={`custom-h-${c.id}`}>
          {c.header}
        </h2>,
      );
      if (c.bullets.length === 1) {
        atoms.push(
          <p className="au-summary" key={`custom-p-${c.id}`}>
            <RichText value={c.bullets[0]} />
          </p>,
        );
      } else {
        atoms.push(
          <div className="au-job" key={`custom-${c.id}`} style={{ paddingLeft: 0 }}>
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
      <PaginatedCanvas mainPaddingMm={[8, 14]} pageClassName="au-root">
        {atoms}
      </PaginatedCanvas>
    </>
  );
}
