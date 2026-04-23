/**
 * Aurora template.
 *
 * Contemporary SaaS/tech aesthetic — a soft gradient header carries
 * identity above a clean single-column body. Section headers are set
 * as compact uppercase labels on a hairline rule with a small accent
 * dot. Experience sits on a lightweight timeline; projects and skills
 * share a restrained left-accent card treatment. The hero appears on
 * page 1 only; content flows onto further pages via `PaginatedCanvas`.
 *
 * PAGINATION: list sections (Experience, Education, Custom) emit one
 * atom per item. Grid sections (Skills, Projects) emit one atom per
 * row-pair so long grids flow across A4 pages at row boundaries
 * instead of moving whole to the next page.
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

export const Aurora = memo(function Aurora({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const initials = extractInitials(resume.profile.name);

  const css = `
    .au-root { font-family: 'Geist', 'Inter', sans-serif; color: #1f2937; font-size: 9.4pt; line-height: 1.5; overflow-wrap: break-word; word-break: break-word; hyphens: auto; }

    .au-hero { position: relative; padding: 11mm 14mm 8mm; overflow: hidden; margin: -8mm -14mm 5mm;
      background:
        radial-gradient(circle at 95% 0%, ${palette.primary100} 0%, transparent 55%),
        linear-gradient(135deg, ${palette.primary50} 0%, #ffffff 70%);
      border-bottom: 1px solid ${palette.primary200};
    }
    .au-card { display: flex; gap: 5mm; align-items: center; }
    .au-avatar { width: 20mm; height: 20mm; border-radius: 50%; background: ${palette.primary700}; color: ${palette.primaryText}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12pt; font-weight: 800; letter-spacing: -0.4px; overflow: hidden; }
    .au-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .au-headbody { flex: 1; min-width: 0; }
    .au-name { font-size: 22pt; font-weight: 800; color: #0a0a0a; line-height: 1.05; letter-spacing: -0.6px; margin: 0; overflow-wrap: break-word; }
    .au-title { font-size: 9.6pt; color: ${palette.primary700}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.8px; margin-top: 1.4mm; overflow-wrap: break-word; }
    .au-contact { display: flex; flex-wrap: wrap; gap: 1.4mm 4mm; margin-top: 2.8mm; font-size: 8.6pt; color: #374151; }
    .au-contact span { display: inline-flex; align-items: center; gap: 1.4mm; max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
    .au-contact svg { color: ${palette.primary600}; flex-shrink: 0; }

    .au-h2 { display: flex; align-items: center; gap: 2.2mm; font-size: 9pt; text-transform: uppercase; letter-spacing: 2px; color: ${palette.primary800}; font-weight: 700; margin: 5mm 0 2.8mm; padding-bottom: 1.4mm; border-bottom: 1px solid ${palette.primary200}; break-after: avoid; page-break-after: avoid; }
    .au-h2::before { content: ""; width: 1.8mm; height: 1.8mm; border-radius: 50%; background: ${palette.primary600}; flex-shrink: 0; }

    .au-summary { font-size: 9.6pt; line-height: 1.6; color: #1e293b; overflow-wrap: break-word; }

    .au-job { position: relative; padding: 0 0 2.8mm 6mm; margin-bottom: 2.2mm; page-break-inside: avoid; break-inside: avoid; }
    .au-job::before { content: ""; position: absolute; left: 0; top: 2.4mm; bottom: 0.4mm; width: 1.2px; background: ${palette.primary300}; }
    .au-job::after { content: ""; position: absolute; left: -1.2mm; top: 1.8mm; width: 3mm; height: 3mm; background: ${palette.primary600}; border-radius: 50%; }
    .au-job.au-plain { padding-left: 0; }
    .au-job.au-plain::before, .au-job.au-plain::after { content: none; }
    .au-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; margin-bottom: 0.6mm; flex-wrap: wrap; }
    .au-jobtitle { font-size: 10.2pt; font-weight: 700; color: #0a0a0a; letter-spacing: -0.15px; min-width: 0; flex: 1 1 auto; overflow-wrap: break-word; }
    .au-jobdates { font-size: 8.2pt; color: ${palette.primary700}; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; flex-shrink: 0; }
    .au-jobco { font-size: 9.2pt; color: ${palette.primary700}; font-weight: 600; margin-bottom: 1.2mm; overflow-wrap: break-word; }
    .au-jobco .loc { color: #6b7280; font-weight: 500; }
    .au-job ul { list-style: none; padding: 0; margin: 0; }
    .au-job li { font-size: 9pt; line-height: 1.5; padding-left: 4mm; position: relative; margin-bottom: 0.7mm; color: #1f2937; overflow-wrap: break-word; }
    .au-job li::before { content: ""; position: absolute; left: 0; top: 2mm; width: 1.4mm; height: 1.4mm; background: ${palette.primary600}; border-radius: 50%; }

    .au-skills { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 2.5mm 4mm; margin-bottom: 2.5mm; }
    .au-skills:last-child { margin-bottom: 0; }
    .au-skill { background: #ffffff; border: 1px solid #e5e7eb; border-left: 2.5px solid ${palette.primary600}; border-radius: 2mm; padding: 2.2mm 3mm; min-width: 0; page-break-inside: avoid; break-inside: avoid; }
    .au-skill-label { font-size: 8.8pt; font-weight: 700; color: #0a0a0a; margin-bottom: 0.9mm; display: flex; align-items: center; gap: 1.6mm; overflow-wrap: break-word; }
    .au-skill-icon { width: 1em; height: 1em; color: ${palette.primary600}; flex-shrink: 0; }
    .au-skill-chips { display: flex; flex-wrap: wrap; gap: 1mm; }
    .au-skill-chip { background: ${palette.primary50}; border: 1px solid ${palette.primary200}; color: ${palette.primary800}; padding: 0.3mm 1.6mm; border-radius: 999px; font-size: 7.6pt; font-weight: 600; max-width: 100%; overflow-wrap: break-word; word-break: break-word; }

    .au-proj { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 2.5mm; margin-bottom: 2.5mm; }
    .au-proj:last-child { margin-bottom: 0; }
    .au-proj-card { background: #ffffff; border: 1px solid #e5e7eb; border-left: 2.5px solid ${palette.primary600}; border-radius: 2mm; padding: 2.4mm 3mm; min-width: 0; page-break-inside: avoid; break-inside: avoid; }
    .au-proj-name { font-size: 9.6pt; font-weight: 700; color: #0a0a0a; overflow-wrap: break-word; }
    .au-proj-role { font-size: 8.2pt; color: ${palette.primary700}; font-weight: 600; margin-top: 0.4mm; overflow-wrap: break-word; }
    .au-proj-desc { font-size: 8.7pt; color: #374151; line-height: 1.45; margin-top: 1.1mm; overflow-wrap: break-word; }
    .au-proj-stack { display: flex; flex-wrap: wrap; gap: 1mm; margin-top: 1.3mm; }
    .au-proj-stackchip { background: ${palette.primary50}; color: ${palette.primary800}; padding: 0.2mm 1.4mm; border-radius: 4px; font-size: 7.4pt; font-weight: 600; border: 1px solid ${palette.primary200}; max-width: 100%; overflow-wrap: break-word; word-break: break-word; }

    .au-edu { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; padding: 1.3mm 0; border-bottom: 1px dashed #e5e7eb; flex-wrap: wrap; page-break-inside: avoid; break-inside: avoid; }
    .au-edu:last-child { border-bottom: 0; }
    .au-edu > div:first-child { min-width: 0; flex: 1 1 auto; }
    .au-edu-title { font-size: 9.6pt; font-weight: 700; color: #0a0a0a; overflow-wrap: break-word; }
    .au-edu-school { font-size: 8.8pt; color: ${palette.primary700}; font-weight: 600; margin-top: 0.3mm; overflow-wrap: break-word; }
    .au-edu-meta { font-size: 8.4pt; color: #6b7280; font-variant-numeric: tabular-nums; text-align: right; flex-shrink: 0; }
    .au-edu-detail { font-size: 8.2pt; color: #6b7280; font-style: italic; margin-top: 0.3mm; overflow-wrap: break-word; }

    .au-two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 5mm; }
    .au-two > div { min-width: 0; }
    .au-item { font-size: 8.8pt; margin-bottom: 1.2mm; color: #1f2937; line-height: 1.45; overflow-wrap: break-word; }
    .au-item strong { color: #0a0a0a; font-weight: 700; overflow-wrap: break-word; }
    .au-item .meta { color: ${palette.primary700}; font-weight: 600; font-variant-numeric: tabular-nums; }

    .au-chips { display: flex; flex-wrap: wrap; gap: 1.2mm; }
    .au-chip { background: ${palette.primary50}; border: 1px solid ${palette.primary200}; color: ${palette.primary800}; padding: 0.4mm 1.8mm; border-radius: 999px; font-size: 7.8pt; font-weight: 600; max-width: 100%; overflow-wrap: break-word; word-break: break-word; }

    .au-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(26mm, 1fr)); gap: 2.2mm; margin-top: 3mm; }
    .au-stat { background: rgba(255,255,255,0.85); border: 1px solid ${palette.primary200}; border-radius: 2mm; padding: 2mm 2.5mm; text-align: center; min-width: 0; }
    .au-stat-value { font-size: 13pt; font-weight: 800; color: ${palette.primary700}; letter-spacing: -0.4px; line-height: 1; overflow-wrap: break-word; }
    .au-stat-label { font-size: 7.4pt; text-transform: uppercase; letter-spacing: 1.2px; color: #6b7280; font-weight: 700; margin-top: 0.8mm; overflow-wrap: break-word; }

    .au-kv { font-size: 8.6pt; margin-bottom: 1.1mm; color: #1f2937; overflow-wrap: break-word; }
    .au-kv strong { color: #0a0a0a; font-weight: 700; overflow-wrap: break-word; }
  `;

  const atoms: React.ReactNode[] = [];

  atoms.push(
    <header className="au-hero" key="head">
      <div className="au-card">
        <div className="au-avatar">
          {resume.profile.photoUrl ? (
            <img src={resume.profile.photoUrl} alt={resume.profile.name} />
          ) : logo ? (
            <logo.Icon style={{ width: "11mm", height: "11mm" }} />
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
            <div className="au-jobdates">{formatDateRange(job.start, job.end)}</div>
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

  // Skills: 2-col grid — one atom per row-pair so long grids flow across pages.
  if (resume.skills.length > 0) {
    atoms.push(
      <h2 className="au-h2" data-keep-with-next="true" key="skills-h">
        Skills
      </h2>,
    );
    for (let i = 0; i < resume.skills.length; i += 2) {
      const pair = resume.skills.slice(i, i + 2);
      atoms.push(
        <div className="au-skills" key={`skills-row-${pair[0].id}`}>
          {pair.map((g) => {
            const GroupIcon = findLogoIcon(g.iconName)?.Icon;
            return (
              <div className="au-skill" key={g.id}>
                <div className="au-skill-label">
                  {GroupIcon && <GroupIcon className="au-skill-icon" />}
                  <span>{g.label}</span>
                </div>
                <div className="au-skill-chips">
                  {splitSkills(g.items).map((s, idx) => (
                    // oxlint-disable-next-line jsx/no-array-index-key
                    <span className="au-skill-chip" key={idx}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>,
      );
    }
  }

  // Projects: 2-col grid — one atom per row-pair so long grids flow across pages.
  if (resume.projects.length > 0) {
    atoms.push(
      <h2 className="au-h2" data-keep-with-next="true" key="proj-h">
        Projects
      </h2>,
    );
    for (let i = 0; i < resume.projects.length; i += 2) {
      const pair = resume.projects.slice(i, i + 2);
      atoms.push(
        <div className="au-proj" key={`proj-row-${pair[0].id}`}>
          {pair.map((p) => (
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
                  {p.stack.map((s, idx) => (
                    // oxlint-disable-next-line jsx/no-array-index-key
                    <span className="au-proj-stackchip" key={idx}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>,
      );
    }
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
          <div className="au-job au-plain" key={`custom-${c.id}`}>
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
});
