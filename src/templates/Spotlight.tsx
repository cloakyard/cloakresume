/**
 * Spotlight template.
 *
 * A confident, executive-ready layout with a dark ink-toned vertical
 * sidebar carrying the photo/monogram, name, contact, quick stats and
 * skills. The right column owns the narrative: a tinted summary block,
 * a large accent timeline for experience, card-style projects, and a
 * neat credentials grid at the bottom. Ideal for senior ICs, founders,
 * and leadership profiles that want a striking but restrained look.
 *
 * Uses the shared `PaginatedCanvas` so narrative content auto-flows
 * onto additional pages; the dark sidebar shows the full identity
 * treatment on page 1 and a slim continuation panel on pages 2+.
 */

import { PaginatedCanvas } from "../components/PaginatedCanvas.tsx";
import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { findLogoIcon } from "../utils/logoIcons.ts";
import { RichText } from "../utils/richText.tsx";
import { contactIcon, splitSkills } from "./shared.tsx";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export function Spotlight({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const initials = resume.profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const css = `
    .sp-root { font-family: 'Geist', 'Inter', sans-serif; color: #111827; font-size: 9.4pt; line-height: 1.5; }

    .sp-left { background: #0b1220; color: #e5e7eb; padding: 13mm 9mm 12mm; position: relative; overflow: hidden; height: 100%; min-height: 297mm; box-sizing: border-box; }
    .sp-left::before { content: ""; position: absolute; top: -20mm; left: -20mm; width: 60mm; height: 60mm; border-radius: 50%; background: ${palette.primary700}; opacity: 0.22; }
    .sp-left::after { content: ""; position: absolute; bottom: 40mm; right: -16mm; width: 40mm; height: 40mm; border: 8mm solid ${palette.primary600}; border-radius: 50%; opacity: 0.18; box-sizing: border-box; }

    .sp-avatar { position: relative; z-index: 1; width: 34mm; height: 34mm; border-radius: 50%; background: linear-gradient(135deg, ${palette.primary600}, ${palette.primary900}); color: ${palette.primaryText}; display: flex; align-items: center; justify-content: center; font-size: 20pt; font-weight: 800; letter-spacing: -0.6px; margin-bottom: 6mm; border: 3px solid rgba(255,255,255,0.18); overflow: hidden; }
    .sp-avatar img { width: 100%; height: 100%; object-fit: cover; }

    .sp-name { position: relative; z-index: 1; font-size: 22pt; font-weight: 800; color: #ffffff; line-height: 1.05; letter-spacing: -0.6px; margin: 0 0 1.6mm; }
    .sp-title { position: relative; z-index: 1; font-size: 9.4pt; color: ${palette.primary300}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.8px; margin-bottom: 5mm; }
    .sp-accent-rule { position: relative; z-index: 1; height: 3px; width: 14mm; background: ${palette.primary600}; margin-bottom: 6mm; border-radius: 2px; }

    .sp-h3 { position: relative; z-index: 1; font-size: 8.2pt; text-transform: uppercase; letter-spacing: 2.4px; color: #ffffff; font-weight: 800; margin: 5mm 0 2.2mm; display: flex; align-items: center; gap: 2mm; }
    .sp-h3::before { content: ""; width: 3mm; height: 3mm; background: ${palette.primary600}; border-radius: 50%; flex-shrink: 0; }
    .sp-h3:first-of-type { margin-top: 0; }

    .sp-contact { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 1.5mm; font-size: 8.4pt; color: #cbd5e1; }
    .sp-contact span { display: inline-flex; align-items: center; gap: 2mm; word-break: break-word; }
    .sp-contact .i { width: 5mm; display: inline-flex; justify-content: center; color: ${palette.primary300}; flex-shrink: 0; }

    .sp-stats { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; }
    .sp-stat { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-left: 2px solid ${palette.primary600}; padding: 2mm 2.5mm; border-radius: 1.5mm; }
    .sp-stat-value { font-size: 13pt; font-weight: 800; color: #ffffff; letter-spacing: -0.4px; line-height: 1; }
    .sp-stat-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 1.2px; color: ${palette.primary300}; font-weight: 700; margin-top: 0.8mm; }

    .sp-skill { position: relative; z-index: 1; margin-bottom: 2.4mm; }
    .sp-skill-label { font-size: 8.4pt; font-weight: 700; color: #ffffff; margin-bottom: 0.5mm; display: flex; align-items: center; gap: 1.5mm; }
    .sp-skill-icon { width: 1em; height: 1em; color: ${palette.primary300}; flex-shrink: 0; }
    .sp-skill-list { font-size: 8.1pt; color: #cbd5e1; line-height: 1.45; }

    .sp-lang { position: relative; z-index: 1; display: flex; justify-content: space-between; font-size: 8.4pt; margin-bottom: 1mm; color: #cbd5e1; padding-bottom: 1mm; border-bottom: 1px dotted rgba(255,255,255,0.15); }
    .sp-lang:last-child { border-bottom: 0; }
    .sp-lang .lvl { color: ${palette.primary300}; font-weight: 700; font-size: 7.8pt; }

    .sp-chips { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 1.2mm; }
    .sp-chip { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #e5e7eb; padding: 0.3mm 1.8mm; border-radius: 999px; font-size: 7.6pt; font-weight: 600; }

    .sp-extra { position: relative; z-index: 1; font-size: 8.2pt; margin-bottom: 1.2mm; color: #cbd5e1; }
    .sp-extra strong { color: #ffffff; font-weight: 700; display: block; text-transform: uppercase; letter-spacing: 0.4px; font-size: 7.6pt; margin-bottom: 0.3mm; }

    .sp-left-slim { height: 100%; min-height: 297mm; box-sizing: border-box; padding: 18mm 9mm; color: #e5e7eb; background: #0b1220; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }
    .sp-left-slim::before { content: ""; position: absolute; top: -20mm; left: -20mm; width: 60mm; height: 60mm; border-radius: 50%; background: ${palette.primary700}; opacity: 0.22; }
    .sp-left-slim-name { position: relative; z-index: 1; font-size: 14pt; font-weight: 800; color: #ffffff; line-height: 1.1; }
    .sp-left-slim-title { position: relative; z-index: 1; font-size: 8pt; color: ${palette.primary300}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.6px; margin-top: 1mm; }
    .sp-left-slim-num { position: relative; z-index: 1; font-size: 44pt; font-weight: 800; color: rgba(255,255,255,0.12); letter-spacing: -1.5px; line-height: 0.9; font-variant-numeric: tabular-nums; }
    .sp-left-slim-cont { position: relative; z-index: 1; font-size: 7.6pt; text-transform: uppercase; letter-spacing: 2.4px; color: ${palette.primary300}; font-weight: 700; }

    .sp-summary-block { background: ${palette.primary50}; border-left: 4px solid ${palette.primary600}; border-radius: 0 3mm 3mm 0; padding: 4mm 5mm; margin-bottom: 6mm; page-break-inside: avoid; break-inside: avoid; }
    .sp-summary-kicker { font-size: 7.8pt; text-transform: uppercase; letter-spacing: 2.4px; color: ${palette.primary700}; font-weight: 800; margin-bottom: 1.8mm; }
    .sp-summary { font-size: 10pt; line-height: 1.62; color: #1f2937; font-weight: 400; }

    .sp-h2 { display: flex; align-items: center; gap: 3mm; font-size: 11pt; font-weight: 800; color: #0a0a0a; text-transform: uppercase; letter-spacing: 2px; margin: 6mm 0 4mm; break-after: avoid; page-break-after: avoid; }
    .sp-h2-num { font-size: 16pt; font-weight: 900; color: ${palette.primary600}; letter-spacing: -0.6px; font-variant-numeric: tabular-nums; line-height: 0.9; }
    .sp-h2-rule { flex: 1; height: 1px; background: #e5e7eb; }

    .sp-job { position: relative; padding: 0 0 5mm 8mm; margin-bottom: 1mm; page-break-inside: avoid; break-inside: avoid; }
    .sp-job::before { content: ""; position: absolute; left: 2.2mm; top: 3mm; bottom: 3mm; width: 2px; background: ${palette.primary200}; }
    .sp-job::after { content: ""; position: absolute; left: 0; top: 1.5mm; width: 6mm; height: 6mm; background: ${palette.primary600}; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 0 2px ${palette.primary200}; }
    .sp-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; margin-bottom: 0.6mm; }
    .sp-jobtitle { font-size: 10.6pt; font-weight: 800; color: #0a0a0a; letter-spacing: -0.2px; }
    .sp-jobdates { font-size: 8.4pt; color: ${palette.primary700}; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; background: ${palette.primary50}; padding: 0.5mm 2.2mm; border-radius: 999px; border: 1px solid ${palette.primary200}; }
    .sp-jobco { font-size: 9.4pt; color: ${palette.primary700}; font-weight: 700; margin-bottom: 1.6mm; }
    .sp-jobco .loc { color: #6b7280; font-weight: 500; }
    .sp-job ul { list-style: none; padding: 0; margin: 0; }
    .sp-job li { font-size: 9pt; line-height: 1.5; padding-left: 5mm; position: relative; margin-bottom: 0.8mm; color: #1f2937; }
    .sp-job li::before { content: "›"; position: absolute; left: 0; color: ${palette.primary600}; font-weight: 800; font-size: 11pt; line-height: 1.15; }

    .sp-proj { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
    .sp-proj-card { border: 1px solid #e5e7eb; border-radius: 3mm; padding: 3mm 3.5mm; background: #ffffff; page-break-inside: avoid; break-inside: avoid; position: relative; overflow: hidden; }
    .sp-proj-card::before { content: ""; position: absolute; top: 0; left: 0; width: 1.5mm; height: 100%; background: linear-gradient(180deg, ${palette.primary600}, ${palette.primary900}); }
    .sp-proj-name { font-size: 9.8pt; font-weight: 700; color: #0a0a0a; padding-left: 1mm; }
    .sp-proj-role { font-size: 8.2pt; color: ${palette.primary700}; font-weight: 600; margin-top: 0.4mm; padding-left: 1mm; }
    .sp-proj-desc { font-size: 8.7pt; color: #374151; line-height: 1.5; margin-top: 1.2mm; padding-left: 1mm; }
    .sp-proj-stack { display: flex; flex-wrap: wrap; gap: 1mm; margin-top: 1.4mm; padding-left: 1mm; }
    .sp-proj-stackchip { background: ${palette.primary50}; color: ${palette.primary900}; padding: 0.2mm 1.4mm; border-radius: 6px; font-size: 7.4pt; font-weight: 600; border: 1px solid ${palette.primary200}; }

    .sp-edu { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; padding: 1.6mm 0; border-bottom: 1px solid #f1f5f9; page-break-inside: avoid; break-inside: avoid; }
    .sp-edu:last-child { border-bottom: 0; }
    .sp-edu-title { font-size: 9.8pt; font-weight: 700; color: #0a0a0a; }
    .sp-edu-school { font-size: 9pt; color: ${palette.primary700}; font-weight: 600; margin-top: 0.4mm; }
    .sp-edu-detail { font-size: 8.2pt; color: #6b7280; font-style: italic; margin-top: 0.3mm; }
    .sp-edu-meta { font-size: 8.6pt; color: #6b7280; font-variant-numeric: tabular-nums; white-space: nowrap; text-align: right; }

    .sp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
    .sp-item { font-size: 8.8pt; margin-bottom: 1.4mm; color: #1f2937; line-height: 1.45; }
    .sp-item strong { color: #0a0a0a; font-weight: 700; }
    .sp-item .meta { color: ${palette.primary700}; font-weight: 600; font-variant-numeric: tabular-nums; }
  `;

  const renderSidebar = (pageIndex: number, pageCount: number) => {
    if (pageIndex === 0) {
      return (
        <div className="sp-left">
          <div className="sp-avatar">
            {resume.profile.photoUrl ? (
              <img src={resume.profile.photoUrl} alt={resume.profile.name} />
            ) : logo ? (
              <logo.Icon style={{ width: "18mm", height: "18mm" }} />
            ) : (
              initials || "—"
            )}
          </div>
          <h1 className="sp-name">{resume.profile.name}</h1>
          {resume.profile.title && <div className="sp-title">{resume.profile.title}</div>}
          <div className="sp-accent-rule" />

          {resume.contact.length > 0 && (
            <>
              <div className="sp-h3">Contact</div>
              <div className="sp-contact">
                {resume.contact.map((c) => (
                  <span key={c.id}>
                    <span className="i">{contactIcon(c.kind, 10)}</span>
                    <span>{c.value}</span>
                  </span>
                ))}
              </div>
            </>
          )}

          {resume.quickStats.length > 0 && (
            <>
              <div className="sp-h3">At a Glance</div>
              <div className="sp-stats">
                {resume.quickStats.map((s) => (
                  <div className="sp-stat" key={s.id}>
                    <div className="sp-stat-value">{s.value}</div>
                    <div className="sp-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {resume.skills.length > 0 && (
            <>
              <div className="sp-h3">Expertise</div>
              {resume.skills.map((g) => {
                const GroupIcon = findLogoIcon(g.iconName)?.Icon;
                return (
                  <div className="sp-skill" key={g.id}>
                    <div className="sp-skill-label">
                      {GroupIcon && <GroupIcon className="sp-skill-icon" />}
                      <span>{g.label}</span>
                    </div>
                    <div className="sp-skill-list">{splitSkills(g.items).join(" · ")}</div>
                  </div>
                );
              })}
            </>
          )}

          {resume.languages.length > 0 && (
            <>
              <div className="sp-h3">Languages</div>
              {resume.languages.map((l) => (
                <div className="sp-lang" key={l.id}>
                  <span>{l.name}</span>
                  {l.level && <span className="lvl">{l.level}</span>}
                </div>
              ))}
            </>
          )}

          {resume.tools.length > 0 && (
            <>
              <div className="sp-h3">{resume.toolsLabel?.trim() || "Tools"}</div>
              <div className="sp-chips">
                {resume.tools.map((t, i) => (
                  // oxlint-disable-next-line jsx/no-array-index-key
                  <span className="sp-chip" key={i}>
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}

          {resume.interests.length > 0 && (
            <>
              <div className="sp-h3">{resume.interestsLabel?.trim() || "Interests"}</div>
              <div className="sp-chips">
                {resume.interests.map((t, i) => (
                  // oxlint-disable-next-line jsx/no-array-index-key
                  <span className="sp-chip" key={i}>
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}

          {resume.extras.length > 0 && (
            <>
              <div className="sp-h3">Extras</div>
              {resume.extras.map((x) => (
                <div className="sp-extra" key={x.id}>
                  <strong>{x.label}</strong>
                  {x.value}
                </div>
              ))}
            </>
          )}
        </div>
      );
    }
    return (
      <div className="sp-left-slim">
        <div>
          <div className="sp-left-slim-name">{resume.profile.name}</div>
          {resume.profile.title && (
            <div className="sp-left-slim-title">{resume.profile.title}</div>
          )}
        </div>
        <div className="sp-left-slim-num">{String(pageIndex + 1).padStart(2, "0")}</div>
        <div className="sp-left-slim-cont">
          Page {pageIndex + 1} of {pageCount}
        </div>
      </div>
    );
  };

  let sectionNum = 0;
  const next = () => String(++sectionNum).padStart(2, "0");

  const atoms: React.ReactNode[] = [];

  if (resume.profile.summary) {
    atoms.push(
      <div className="sp-summary-block" key="summary">
        <div className="sp-summary-kicker">Profile</div>
        <div className="sp-summary">
          <RichText value={resume.profile.summary} />
        </div>
      </div>,
    );
  }

  if (resume.experience.length > 0) {
    const num = next();
    atoms.push(
      <h2 className="sp-h2" data-keep-with-next="true" key="exp-h">
        <span className="sp-h2-num">{num}</span>
        <span>Experience</span>
        <span className="sp-h2-rule" />
      </h2>,
    );
    resume.experience.forEach((job) => {
      atoms.push(
        <div className="sp-job" key={`exp-${job.id}`}>
          <div className="sp-jobhead">
            <div className="sp-jobtitle">{job.title}</div>
            <div className="sp-jobdates">
              {job.start}
              {job.end ? ` – ${job.end}` : ""}
            </div>
          </div>
          <div className="sp-jobco">
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

  // Projects: 2-col grid — single atom preserves layout.
  if (resume.projects.length > 0) {
    const num = next();
    atoms.push(
      <div key="proj">
        <h2 className="sp-h2">
          <span className="sp-h2-num">{num}</span>
          <span>Projects</span>
          <span className="sp-h2-rule" />
        </h2>
        <div className="sp-proj">
          {resume.projects.map((p) => (
            <div className="sp-proj-card" key={p.id}>
              <div className="sp-proj-name">{p.name}</div>
              {p.role && <div className="sp-proj-role">{p.role}</div>}
              {p.description && (
                <div className="sp-proj-desc">
                  <RichText value={p.description} />
                </div>
              )}
              {p.stack.length > 0 && (
                <div className="sp-proj-stack">
                  {p.stack.map((s, i) => (
                    // oxlint-disable-next-line jsx/no-array-index-key
                    <span className="sp-proj-stackchip" key={i}>
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
    const num = next();
    atoms.push(
      <h2 className="sp-h2" data-keep-with-next="true" key="edu-h">
        <span className="sp-h2-num">{num}</span>
        <span>Education</span>
        <span className="sp-h2-rule" />
      </h2>,
    );
    resume.education.forEach((ed) => {
      atoms.push(
        <div className="sp-edu" key={`edu-${ed.id}`}>
          <div>
            <div className="sp-edu-title">{ed.degree}</div>
            <div className="sp-edu-school">
              {ed.school}
              {ed.location ? `, ${ed.location}` : ""}
            </div>
            {ed.detail && <div className="sp-edu-detail">{ed.detail}</div>}
          </div>
          <div className="sp-edu-meta">
            {ed.start}
            {ed.end ? ` – ${ed.end}` : ""}
          </div>
        </div>,
      );
    });
  }

  // Credentials: 2-col grid — single atom preserves layout.
  if (resume.certifications.length > 0 || resume.awards.length > 0) {
    const num = next();
    atoms.push(
      <div key="cred">
        <h2 className="sp-h2">
          <span className="sp-h2-num">{num}</span>
          <span>Credentials</span>
          <span className="sp-h2-rule" />
        </h2>
        <div className="sp-grid-2">
          {resume.certifications.length > 0 && (
            <div>
              {resume.certifications.map((c) => (
                <div className="sp-item" key={c.id}>
                  <strong>{c.name}</strong>
                  {c.issuer ? ` — ${c.issuer}` : ""}
                  {c.year ? <span className="meta"> · {c.year}</span> : null}
                </div>
              ))}
            </div>
          )}
          {resume.awards.length > 0 && (
            <div>
              {resume.awards.map((a) => (
                <div className="sp-item" key={a.id}>
                  <strong>{a.title}</strong>
                  {a.detail ? ` — ${a.detail}` : ""}
                  {a.year ? <span className="meta"> · {a.year}</span> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>,
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="sp-root">
        <PaginatedCanvas
          sidebar={renderSidebar}
          sidebarWidthMm={72}
          sidebarPaddingMm={[0, 0]}
          mainPaddingMm={[13, 12]}
        >
          {atoms}
        </PaginatedCanvas>
      </div>
    </>
  );
}
