/**
 * DuoTone template.
 *
 * A high-contrast magazine-cover layout: the left 38% of the page is a
 * saturated accent panel carrying the candidate identity, contact
 * details, skills, and a large initial monogram. The right column is
 * white and owns the narrative (summary, experience, projects,
 * education). Designed to make a strong first impression for product,
 * design, marketing, and founder-style roles. Both halves are
 * print-friendly (solid colours only, no gradients behind body text).
 *
 * Uses the shared `PaginatedCanvas` so the right-column narrative auto-
 * flows across additional A4 pages. The left panel shows the full
 * identity treatment on page 1 and a slim continuation strip on page 2+.
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
  renderContactValue,
  splitSkills,
} from "./shared.tsx";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export function DuoTone({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const initials = extractInitials(resume.profile.name);

  const css = `
    .dt-root { font-family: 'Geist', 'Inter', sans-serif; color: #111827; font-size: 9.2pt; line-height: 1.5; }
    .dt-left { background: ${palette.primary900}; color: ${palette.primaryText}; padding: 16mm 10mm 12mm; position: relative; overflow: hidden; height: 100%; min-height: 297mm; box-sizing: border-box; }
    .dt-left::before { content: ""; position: absolute; top: -14mm; right: -14mm; width: 44mm; height: 44mm; border-radius: 50%; background: ${palette.primary600}; opacity: 0.45; }
    .dt-left::after { content: ""; position: absolute; bottom: -10mm; left: -10mm; width: 32mm; height: 32mm; border-radius: 50%; background: ${palette.primary700}; opacity: 0.35; }
    .dt-monogram { position: relative; z-index: 1; width: 26mm; height: 26mm; border-radius: 50%; background: ${palette.primaryText}; color: ${palette.primary900}; display: flex; align-items: center; justify-content: center; font-size: 16pt; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6mm; overflow: hidden; }
    .dt-monogram img { width: 100%; height: 100%; object-fit: cover; }
    .dt-name { position: relative; z-index: 1; font-size: 22pt; font-weight: 800; line-height: 1.02; letter-spacing: -0.6px; margin: 0 0 2mm; }
    .dt-title { position: relative; z-index: 1; font-size: 9.6pt; font-weight: 600; text-transform: uppercase; letter-spacing: 1.6px; opacity: 0.92; margin-bottom: 6mm; }
    .dt-rule { position: relative; z-index: 1; height: 2px; background: ${palette.primaryText}; width: 14mm; opacity: 0.85; margin-bottom: 5mm; }
    .dt-left-h3 { position: relative; z-index: 1; font-size: 8.6pt; text-transform: uppercase; letter-spacing: 2.4px; font-weight: 700; opacity: 0.9; margin: 5mm 0 2.5mm; border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 1.5mm; }
    .dt-left-h3:first-of-type { margin-top: 0; }
    .dt-contact { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 1.5mm; font-size: 8.4pt; }
    .dt-contact span { display: inline-flex; align-items: center; gap: 2mm; word-break: break-word; }
    .dt-contact .i { width: 5mm; display: inline-flex; justify-content: center; opacity: 0.9; }
    .dt-skill { position: relative; z-index: 1; margin-bottom: 2.2mm; }
    .dt-skill-label { font-size: 8.4pt; font-weight: 700; letter-spacing: 0.2px; margin-bottom: 0.4mm; }
    .dt-skill-list { font-size: 8.2pt; line-height: 1.45; opacity: 0.88; }
    .dt-lang { position: relative; z-index: 1; display: flex; justify-content: space-between; font-size: 8.4pt; margin-bottom: 1mm; padding-bottom: 1mm; border-bottom: 1px dotted rgba(255,255,255,0.25); }
    .dt-lang:last-child { border-bottom: 0; }
    .dt-lang .lvl { opacity: 0.75; font-size: 8pt; }
    .dt-chip-row { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 1.2mm; }
    .dt-chip { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: ${palette.primaryText}; padding: 0.3mm 1.6mm; border-radius: 999px; font-size: 7.6pt; font-weight: 600; }
    .dt-extra { position: relative; z-index: 1; font-size: 8.2pt; margin-bottom: 1.2mm; line-height: 1.4; }
    .dt-extra strong { display: block; letter-spacing: 0.2px; margin-bottom: 0.3mm; }

    .dt-left-slim { height: 100%; min-height: 297mm; box-sizing: border-box; padding: 18mm 10mm; color: ${palette.primaryText}; background: ${palette.primary900}; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }
    .dt-left-slim::before { content: ""; position: absolute; top: -14mm; right: -14mm; width: 44mm; height: 44mm; border-radius: 50%; background: ${palette.primary600}; opacity: 0.45; }
    .dt-left-slim-name { position: relative; z-index: 1; font-size: 13pt; font-weight: 800; letter-spacing: -0.3px; line-height: 1.1; }
    .dt-left-slim-cont { position: relative; z-index: 1; font-size: 7.8pt; text-transform: uppercase; letter-spacing: 2.4px; opacity: 0.65; font-weight: 700; }
    .dt-left-slim-num { position: relative; z-index: 1; font-size: 40pt; font-weight: 800; color: rgba(255,255,255,0.12); letter-spacing: -1.5px; line-height: 0.9; font-variant-numeric: tabular-nums; }

    .dt-right-head { display: flex; align-items: center; gap: 4mm; margin-bottom: 6mm; padding-bottom: 3mm; border-bottom: 3px solid #0a0a0a; }
    .dt-right-tag { font-size: 7.8pt; text-transform: uppercase; letter-spacing: 3px; color: ${palette.primary700}; font-weight: 700; }
    .dt-right-tag::before { content: "— "; }
    .dt-h2 { font-size: 11pt; font-weight: 800; color: #0a0a0a; text-transform: uppercase; letter-spacing: 1.6px; margin: 6mm 0 3mm; display: flex; align-items: center; gap: 3mm; break-after: avoid; page-break-after: avoid; }
    .dt-h2::before { content: ""; width: 3mm; height: 3mm; background: ${palette.primary600}; border-radius: 50%; flex-shrink: 0; }
    .dt-summary { font-size: 9.8pt; line-height: 1.6; color: #1f2937; font-weight: 400; }
    .dt-job { margin-bottom: 4mm; page-break-inside: avoid; break-inside: avoid; position: relative; padding-left: 5mm; }
    .dt-job::before { content: ""; position: absolute; left: 0; top: 1.5mm; bottom: 1mm; width: 2px; background: ${palette.primary200}; }
    .dt-job::after { content: ""; position: absolute; left: -1.5mm; top: 1.5mm; width: 5mm; height: 5mm; background: ${palette.primary600}; border-radius: 50%; border: 2px solid #ffffff; }
    .dt-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; margin-bottom: 0.4mm; }
    .dt-jobtitle { font-size: 10.4pt; font-weight: 700; color: #0a0a0a; }
    .dt-jobmeta { font-size: 8.6pt; color: #6b7280; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .dt-jobco { font-size: 9.4pt; color: ${palette.primary700}; font-weight: 700; margin-bottom: 1.4mm; }
    .dt-job ul { list-style: none; padding: 0; margin: 0; }
    .dt-job li { font-size: 9.2pt; line-height: 1.5; padding-left: 4mm; position: relative; margin-bottom: 0.8mm; color: #1f2937; }
    .dt-job li::before { content: ""; position: absolute; left: 0; top: 1.8mm; width: 1.8mm; height: 1.8mm; background: ${palette.primary600}; transform: rotate(45deg); }
    .dt-proj { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
    .dt-proj-card { border: 1px solid #e5e7eb; border-top: 3px solid ${palette.primary600}; border-radius: 2px; padding: 2.5mm 3mm; background: #fafafa; page-break-inside: avoid; break-inside: avoid; }
    .dt-proj-name { font-size: 9.6pt; font-weight: 700; color: #0a0a0a; margin-bottom: 0.5mm; }
    .dt-proj-role { font-size: 8.4pt; color: #6b7280; font-style: italic; margin-bottom: 1mm; }
    .dt-proj-desc { font-size: 8.8pt; color: #1f2937; line-height: 1.45; margin-bottom: 1.2mm; }
    .dt-proj-stack { font-size: 8pt; color: ${palette.primary700}; font-weight: 600; }
    .dt-edu { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.5mm; gap: 4mm; page-break-inside: avoid; break-inside: avoid; }
    .dt-edu-title { font-size: 9.8pt; font-weight: 700; color: #0a0a0a; }
    .dt-edu-school { font-size: 9pt; color: ${palette.primary700}; font-weight: 600; }
    .dt-edu-meta { font-size: 8.6pt; color: #6b7280; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .dt-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
    .dt-item { font-size: 9pt; margin-bottom: 1.4mm; color: #1f2937; line-height: 1.45; }
    .dt-item strong { color: #0a0a0a; font-weight: 700; }
    .dt-item .meta { color: #6b7280; }
  `;

  const renderSidebar = (pageIndex: number, pageCount: number) => {
    if (pageIndex === 0) {
      return (
        <div className="dt-left">
          <div className="dt-monogram">
            {resume.profile.photoUrl ? (
              <img src={resume.profile.photoUrl} alt={resume.profile.name} />
            ) : logo ? (
              <logo.Icon style={{ width: "14mm", height: "14mm" }} />
            ) : (
              initials || "—"
            )}
          </div>
          <h1 className="dt-name">{resume.profile.name}</h1>
          {resume.profile.title && <div className="dt-title">{resume.profile.title}</div>}
          <div className="dt-rule" />

          {resume.contact.length > 0 && (
            <>
              <div className="dt-left-h3">Contact</div>
              <div className="dt-contact">
                {resume.contact.map((c) => (
                  <span key={c.id}>
                    <span className="i">{contactIcon(c.kind, 10)}</span>
                    <span>{renderContactValue(c)}</span>
                  </span>
                ))}
              </div>
            </>
          )}

          {resume.skills.length > 0 && (
            <>
              <div className="dt-left-h3">Expertise</div>
              {resume.skills.map((g) => (
                <div className="dt-skill" key={g.id}>
                  <div className="dt-skill-label">{g.label}</div>
                  <div className="dt-skill-list">{splitSkills(g.items).join(" · ")}</div>
                </div>
              ))}
            </>
          )}

          {resume.languages.length > 0 && (
            <>
              <div className="dt-left-h3">Languages</div>
              {resume.languages.map((l) => (
                <div className="dt-lang" key={l.id}>
                  <span>{l.name}</span>
                  {l.level && <span className="lvl">{l.level}</span>}
                </div>
              ))}
            </>
          )}

          {resume.tools.length > 0 && (
            <>
              <div className="dt-left-h3">{resume.toolsLabel?.trim() || "Tools"}</div>
              <div className="dt-chip-row">
                {resume.tools.map((t, i) => (
                  // oxlint-disable-next-line jsx/no-array-index-key
                  <span className="dt-chip" key={i}>
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}

          {resume.interests.length > 0 && (
            <>
              <div className="dt-left-h3">{resume.interestsLabel?.trim() || "Interests"}</div>
              <div className="dt-chip-row">
                {resume.interests.map((t, i) => (
                  // oxlint-disable-next-line jsx/no-array-index-key
                  <span className="dt-chip" key={i}>
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}

          {resume.extras.length > 0 && (
            <>
              <div className="dt-left-h3">Extras</div>
              {resume.extras.map((x) => (
                <div className="dt-extra" key={x.id}>
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
      <div className="dt-left-slim">
        <div className="dt-left-slim-name">{resume.profile.name}</div>
        <div className="dt-left-slim-num">{String(pageIndex + 1).padStart(2, "0")}</div>
        <div className="dt-left-slim-cont">
          Page {pageIndex + 1} of {pageCount}
        </div>
      </div>
    );
  };

  const atoms: React.ReactNode[] = [];

  atoms.push(
    <div className="dt-right-head" key="tag">
      <div className="dt-right-tag">Résumé</div>
    </div>,
  );

  if (resume.profile.summary) {
    atoms.push(
      <h2 className="dt-h2" data-keep-with-next="true" key="summary-h">
        Profile
      </h2>,
      <p className="dt-summary" key="summary-p">
        <RichText value={resume.profile.summary} />
      </p>,
    );
  }

  if (resume.experience.length > 0) {
    atoms.push(
      <h2 className="dt-h2" data-keep-with-next="true" key="exp-h">
        Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      atoms.push(
        <div className="dt-job" key={`exp-${job.id}`}>
          <div className="dt-jobhead">
            <div className="dt-jobtitle">{job.title}</div>
            <div className="dt-jobmeta">
              {job.start}
              {job.end ? ` – ${job.end}` : ""}
              {job.location ? ` · ${job.location}` : ""}
            </div>
          </div>
          <div className="dt-jobco">{job.company}</div>
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
    atoms.push(
      <div key="proj">
        <h2 className="dt-h2">Projects</h2>
        <div className="dt-proj">
          {resume.projects.map((p) => (
            <div className="dt-proj-card" key={p.id}>
              <div className="dt-proj-name">{p.name}</div>
              {p.role && <div className="dt-proj-role">{p.role}</div>}
              {p.description && (
                <div className="dt-proj-desc">
                  <RichText value={p.description} />
                </div>
              )}
              {p.stack.length > 0 && <div className="dt-proj-stack">{p.stack.join(" · ")}</div>}
            </div>
          ))}
        </div>
      </div>,
    );
  }

  if (resume.education.length > 0) {
    atoms.push(
      <h2 className="dt-h2" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      atoms.push(
        <div className="dt-edu" key={`edu-${ed.id}`}>
          <div>
            <div className="dt-edu-title">{ed.degree}</div>
            <div className="dt-edu-school">
              {ed.school}
              {ed.location ? `, ${ed.location}` : ""}
              {ed.detail ? ` · ${ed.detail}` : ""}
            </div>
          </div>
          <div className="dt-edu-meta">
            {ed.start}
            {ed.end ? ` – ${ed.end}` : ""}
          </div>
        </div>,
      );
    });
  }

  // Credentials: 2-col grid — single atom preserves layout.
  if (resume.certifications.length > 0 || resume.awards.length > 0) {
    atoms.push(
      <div className="dt-grid-2" key="rec">
        {resume.certifications.length > 0 && (
          <div>
            <h2 className="dt-h2">Certifications</h2>
            {resume.certifications.map((c) => (
              <div className="dt-item" key={c.id}>
                {certificationLink(c, <strong>{c.name}</strong>)}
                {c.issuer ? ` — ${c.issuer}` : ""}
                {c.year ? <span className="meta"> · {c.year}</span> : null}
              </div>
            ))}
          </div>
        )}
        {resume.awards.length > 0 && (
          <div>
            <h2 className="dt-h2">Awards</h2>
            {resume.awards.map((a) => (
              <div className="dt-item" key={a.id}>
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

  resume.custom
    .filter((c) => c.header.trim() && c.bullets.some((b) => b.trim()))
    .forEach((c) => {
      atoms.push(
        <h2 className="dt-h2" data-keep-with-next="true" key={`custom-h-${c.id}`}>
          {c.header}
        </h2>,
      );
      if (c.bullets.length === 1) {
        atoms.push(
          <p className="dt-summary" key={`custom-p-${c.id}`}>
            <RichText value={c.bullets[0]} />
          </p>,
        );
      } else {
        atoms.push(
          <div className="dt-job" key={`custom-${c.id}`} style={{ paddingLeft: 0 }}>
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
      <div className="dt-root">
        <PaginatedCanvas
          sidebar={renderSidebar}
          sidebarWidthMm={78}
          sidebarPaddingMm={[0, 0]}
          mainPaddingMm={[14, 14]}
        >
          {atoms}
        </PaginatedCanvas>
      </div>
    </>
  );
}
