/**
 * Bauhaus template.
 *
 * Geometric, colour-blocked editorial layout inspired by the Bauhaus
 * movement. The header is three interlocking blocks: an accent square
 * carrying the monogram/logo, a dark block carrying the name, and a
 * tinted block carrying title + contact. Sections are marked with
 * primitive shapes (circle, square, triangle) in the accent colour.
 * Bold, design-forward, and unmistakably modern.
 *
 * Body flows as a single column so the shared `PaginatedCanvas` can
 * auto-paginate long content across additional A4 pages at clean
 * section boundaries. The colour-blocked header appears on page 1 only.
 */

import { memo } from "react";
import { PaginatedCanvas } from "../components/PaginatedCanvas.tsx";
import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { findLogoIcon } from "../utils/logoIcons.ts";
import { RichText } from "../utils/richText.tsx";
import { pushSplitItem } from "./paginationAtoms.tsx";
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

export const Bauhaus = memo(function Bauhaus({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const initials = extractInitials(resume.profile.name);

  const css = `
    .bh-root { font-family: 'Geist', 'Inter', sans-serif; color: #111827; font-size: 9.4pt; line-height: 1.5; overflow-wrap: break-word; word-break: break-word; hyphens: auto; }
    .bh-head { display: grid; grid-template-columns: 42mm minmax(0, 1fr) 60mm; grid-template-rows: 18mm 22mm; gap: 0; margin: 0 0 6mm; border: 2px solid #0a0a0a; }
    .bh-logo { background: ${palette.primary600}; color: ${palette.primaryText}; display: flex; align-items: center; justify-content: center; grid-row: 1 / span 2; border-right: 2px solid #0a0a0a; font-size: 22pt; font-weight: 900; letter-spacing: -1px; overflow: hidden; min-width: 0; }
    .bh-logo img { width: 100%; height: 100%; object-fit: cover; }
    .bh-name-block { background: #0a0a0a; color: #ffffff; display: flex; align-items: center; padding: 0 6mm; grid-column: 2; grid-row: 1 / span 2; border-right: 2px solid #0a0a0a; min-width: 0; }
    .bh-name { font-size: 22pt; font-weight: 900; letter-spacing: -0.8px; line-height: 1; margin: 0; overflow-wrap: break-word; min-width: 0; }
    .bh-title-block { background: ${palette.primary50}; padding: 3mm 5mm; display: flex; align-items: center; border-bottom: 2px solid #0a0a0a; min-width: 0; }
    .bh-title { font-size: 9.6pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2.2px; color: ${palette.primary900}; overflow-wrap: break-word; min-width: 0; }
    .bh-contact-block { padding: 3mm 5mm; display: flex; flex-direction: column; justify-content: center; gap: 1.2mm; font-size: 8pt; color: #1f2937; background: #ffffff; min-width: 0; }
    .bh-contact-block span { display: inline-flex; align-items: flex-start; gap: 1.6mm; max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
    .bh-contact-block svg { color: ${palette.primary600}; flex-shrink: 0; margin-top: 0.5mm; }

    .bh-h2 { display: flex; align-items: center; gap: 2.5mm; font-size: 10pt; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #0a0a0a; margin: 5mm 0 3mm; padding-bottom: 1.4mm; border-bottom: 2px solid #0a0a0a; break-after: avoid; page-break-after: avoid; overflow-wrap: break-word; }
    .bh-shape { width: 4mm; height: 4mm; flex-shrink: 0; }
    .bh-shape.circle { background: ${palette.primary600}; border-radius: 50%; }
    .bh-shape.square { background: ${palette.primary700}; }
    .bh-shape.triangle { width: 0; height: 0; background: transparent; border-left: 2mm solid transparent; border-right: 2mm solid transparent; border-bottom: 3.5mm solid ${palette.primary600}; }
    .bh-shape.bar { background: ${palette.primary900}; width: 6mm; height: 2mm; }
    .bh-shape.diamond { width: 3.4mm; height: 3.4mm; background: ${palette.primary700}; transform: rotate(45deg); }
    .bh-shape.ring { width: 4mm; height: 4mm; border: 1.5px solid ${palette.primary700}; border-radius: 50%; background: transparent; }
    .bh-shape.halfdisc { width: 4mm; height: 4mm; background: ${palette.primary600}; border-top-left-radius: 4mm; border-top-right-radius: 4mm; }

    .bh-summary { font-size: 10pt; line-height: 1.6; color: #1f2937; padding: 3mm 4mm; background: ${palette.primary50}; border-left: 4px solid ${palette.primary600}; overflow-wrap: break-word; }

    .bh-job { margin-bottom: 3.5mm; page-break-inside: avoid; break-inside: avoid; }
    .bh-job-head { margin-bottom: 0; }
    .bh-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; border-bottom: 1px solid #0a0a0a; padding-bottom: 0.8mm; margin-bottom: 1.4mm; flex-wrap: wrap; }
    .bh-jobtitle { font-size: 10.4pt; font-weight: 800; color: #0a0a0a; letter-spacing: -0.15px; min-width: 0; flex: 1 1 auto; overflow-wrap: break-word; }
    .bh-jobdates { font-size: 8.4pt; font-weight: 700; color: #ffffff; background: #0a0a0a; padding: 0.6mm 2.2mm; font-variant-numeric: tabular-nums; white-space: nowrap; letter-spacing: 0.4px; flex-shrink: 0; }
    .bh-jobco { font-size: 9.2pt; color: ${palette.primary700}; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.6mm; overflow-wrap: break-word; }
    .bh-jobco .loc { color: #6b7280; font-weight: 500; text-transform: none; letter-spacing: 0; }
    .bh-job ul { list-style: none; padding: 0; margin: 0; }
    .bh-job li { font-size: 9pt; line-height: 1.5; padding-left: 5mm; position: relative; margin-bottom: 0.8mm; color: #1f2937; overflow-wrap: break-word; }
    .bh-job li::before { content: ""; position: absolute; left: 0; top: 1.8mm; width: 2.2mm; height: 2.2mm; background: ${palette.primary600}; }
    .bh-ul-bullet { list-style: none; padding: 0; margin: 0; }
    .bh-ul-bullet li { font-size: 9pt; line-height: 1.5; padding-left: 5mm; position: relative; margin-bottom: 0.8mm; color: #1f2937; overflow-wrap: break-word; }
    .bh-ul-bullet li::before { content: ""; position: absolute; left: 0; top: 1.8mm; width: 2.2mm; height: 2.2mm; background: ${palette.primary600}; }
    .bh-ul-bullet-first { margin-top: 0; }
    .bh-ul-bullet-last { margin-bottom: 3.5mm; }

    .bh-skill { margin-bottom: 2.2mm; min-width: 0; page-break-inside: avoid; break-inside: avoid; }
    .bh-skill-label { font-size: 8.6pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.4px; color: #0a0a0a; margin-bottom: 0.6mm; display: flex; align-items: center; gap: 1.6mm; overflow-wrap: break-word; }
    .bh-skill-label::before { content: ""; width: 2mm; height: 2mm; background: ${palette.primary600}; flex-shrink: 0; }
    .bh-skill-icon { width: 1em; height: 1em; color: ${palette.primary700}; flex-shrink: 0; }
    .bh-skill-list { font-size: 8.8pt; color: #1f2937; line-height: 1.5; overflow-wrap: anywhere; word-break: break-word; }

    .bh-proj { border: 2px solid #0a0a0a; padding: 0; page-break-inside: avoid; break-inside: avoid; margin-bottom: 3mm; display: grid; grid-template-columns: 6mm minmax(0, 1fr); }
    .bh-proj-accent { background: ${palette.primary600}; }
    .bh-proj-body { padding: 2.5mm 3mm; min-width: 0; }
    .bh-proj-name { font-size: 10pt; font-weight: 800; color: #0a0a0a; overflow-wrap: break-word; }
    .bh-proj-role { font-size: 8.2pt; color: ${palette.primary700}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 0.3mm; overflow-wrap: break-word; }
    .bh-proj-desc { font-size: 8.8pt; color: #374151; line-height: 1.5; margin-top: 1mm; overflow-wrap: break-word; }
    .bh-proj-stack { font-size: 8pt; color: ${palette.primary900}; font-weight: 700; margin-top: 1.2mm; letter-spacing: 0.2px; overflow-wrap: anywhere; }

    .bh-edu { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2mm 4mm; padding-bottom: 1.6mm; margin-bottom: 1.6mm; border-bottom: 1px dashed #0a0a0a; page-break-inside: avoid; break-inside: avoid; }
    .bh-edu:last-child { border-bottom: 0; }
    .bh-edu > div:first-child { min-width: 0; }
    .bh-edu-title { font-size: 9.6pt; font-weight: 800; color: #0a0a0a; overflow-wrap: break-word; }
    .bh-edu-school { font-size: 8.8pt; color: ${palette.primary700}; font-weight: 700; overflow-wrap: break-word; }
    .bh-edu-meta { font-size: 8.4pt; color: #0a0a0a; font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 700; }
    .bh-edu-detail { font-size: 8.2pt; color: #6b7280; font-style: italic; margin-top: 0.3mm; grid-column: 1 / -1; overflow-wrap: break-word; }

    .bh-item { font-size: 8.8pt; margin-bottom: 1.4mm; color: #1f2937; line-height: 1.45; padding-left: 4mm; position: relative; overflow-wrap: break-word; }
    .bh-item::before { content: ""; position: absolute; left: 0; top: 1.7mm; width: 2mm; height: 2mm; background: ${palette.primary700}; transform: rotate(45deg); }
    .bh-item strong { color: #0a0a0a; font-weight: 800; overflow-wrap: break-word; }
    .bh-item .meta { color: ${palette.primary700}; font-weight: 700; }

    .bh-two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 5mm; }
    .bh-two > div { min-width: 0; }

    .bh-chips { display: flex; flex-wrap: wrap; gap: 1.5mm; }
    .bh-chip { background: #ffffff; border: 1.5px solid #0a0a0a; color: #0a0a0a; padding: 0.4mm 2.2mm; font-size: 7.8pt; font-weight: 700; letter-spacing: 0.1px; max-width: 100%; overflow-wrap: break-word; word-break: break-word; }
    .bh-chip.accent { background: ${palette.primary600}; color: ${palette.primaryText}; border-color: ${palette.primary600}; }

    .bh-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(28mm, 1fr)); gap: 0; border: 2px solid #0a0a0a; page-break-inside: avoid; break-inside: avoid; }
    .bh-stat { padding: 2.5mm 3mm; text-align: center; border-right: 2px solid #0a0a0a; min-width: 0; }
    .bh-stat:last-child { border-right: 0; }
    .bh-stat:nth-child(odd) { background: ${palette.primary50}; }
    .bh-stat-value { font-size: 14pt; font-weight: 900; color: ${palette.primary700}; letter-spacing: -0.4px; line-height: 1; overflow-wrap: break-word; }
    .bh-stat-label { font-size: 7.2pt; text-transform: uppercase; letter-spacing: 1.6px; color: #0a0a0a; font-weight: 800; margin-top: 1mm; overflow-wrap: break-word; }

    .bh-kv { font-size: 8.6pt; margin-bottom: 1mm; color: #1f2937; overflow-wrap: break-word; }
    .bh-kv strong { color: #0a0a0a; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; overflow-wrap: break-word; }
  `;

  const atoms: React.ReactNode[] = [];

  atoms.push(
    <header className="bh-head" key="head">
      <div className="bh-logo">
        {resume.profile.photoUrl ? (
          <img src={resume.profile.photoUrl} alt={resume.profile.name} />
        ) : logo ? (
          <logo.Icon style={{ width: "16mm", height: "16mm" }} />
        ) : (
          initials || "—"
        )}
      </div>
      <div className="bh-name-block">
        <h1 className="bh-name">{resume.profile.name}</h1>
      </div>
      <div className="bh-title-block">
        <div className="bh-title">{resume.profile.title || "—"}</div>
      </div>
      <div className="bh-contact-block">
        {resume.contact.slice(0, 4).map((c) => (
          <span key={c.id}>
            {contactIcon(c.kind, 10)}
            {renderContactValue(c)}
          </span>
        ))}
      </div>
    </header>,
  );

  if (resume.profile.summary) {
    atoms.push(
      <h2 className="bh-h2" data-keep-with-next="true" key="summary-h">
        <span className="bh-shape circle" />
        Profile
      </h2>,
      <div className="bh-summary" key="summary-p">
        <RichText value={resume.profile.summary} />
      </div>,
    );
  }

  if (resume.quickStats.length > 0) {
    atoms.push(
      <div className="bh-stats" key="stats">
        {resume.quickStats.map((s) => (
          <div className="bh-stat" key={s.id}>
            <div className="bh-stat-value">{s.value}</div>
            <div className="bh-stat-label">{s.label}</div>
          </div>
        ))}
      </div>,
    );
  }

  if (resume.experience.length > 0) {
    atoms.push(
      <h2 className="bh-h2" data-keep-with-next="true" key="exp-h">
        <span className="bh-shape square" />
        Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      const head = (
        <div className="bh-job bh-job-head" key={`exp-${job.id}-head-inner`}>
          <div className="bh-jobhead">
            <div className="bh-jobtitle">{job.title}</div>
            <div className="bh-jobdates">{formatDateRange(job.start, job.end)}</div>
          </div>
          <div className="bh-jobco">
            {job.company}
            {job.location ? <span className="loc"> · {job.location}</span> : null}
          </div>
        </div>
      );
      if (job.bullets.length === 0) {
        atoms.push(
          <div className="bh-job" key={`exp-${job.id}`}>
            <div className="bh-jobhead">
              <div className="bh-jobtitle">{job.title}</div>
              <div className="bh-jobdates">{formatDateRange(job.start, job.end)}</div>
            </div>
            <div className="bh-jobco">
              {job.company}
              {job.location ? <span className="loc"> · {job.location}</span> : null}
            </div>
          </div>,
        );
        return;
      }
      pushSplitItem(atoms, {
        keyPrefix: `exp-${job.id}`,
        renderHead: () => head,
        bullets: job.bullets,
        renderBullet: (bullet, i, total) => {
          const cls = [
            "bh-ul-bullet",
            i === 0 ? "bh-ul-bullet-first" : "",
            i === total - 1 ? "bh-ul-bullet-last" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <ul className={cls}>
              <li>
                <RichText value={bullet} />
              </li>
            </ul>
          );
        },
      });
    });
  }

  // Skills: 2-col grid — single atom preserves layout.
  if (resume.skills.length > 0) {
    atoms.push(
      <div key="skills">
        <h2 className="bh-h2">
          <span className="bh-shape triangle" />
          Skills
        </h2>
        <div className="bh-two">
          {resume.skills.map((g) => {
            const GroupIcon = findLogoIcon(g.iconName)?.Icon;
            return (
              <div className="bh-skill" key={g.id}>
                <div className="bh-skill-label">
                  {GroupIcon && <GroupIcon className="bh-skill-icon" />}
                  <span>{g.label}</span>
                </div>
                <div className="bh-skill-list">{splitSkills(g.items).join(" · ")}</div>
              </div>
            );
          })}
        </div>
      </div>,
    );
  }

  if (resume.projects.length > 0) {
    atoms.push(
      <h2 className="bh-h2" data-keep-with-next="true" key="proj-h">
        <span className="bh-shape diamond" />
        Projects
      </h2>,
    );
    resume.projects.forEach((p) => {
      atoms.push(
        <div className="bh-proj" key={`proj-${p.id}`}>
          <div className="bh-proj-accent" />
          <div className="bh-proj-body">
            <div className="bh-proj-name">{p.name}</div>
            {p.role && <div className="bh-proj-role">{p.role}</div>}
            {p.description && (
              <div className="bh-proj-desc">
                <RichText value={p.description} />
              </div>
            )}
            {p.stack.length > 0 && <div className="bh-proj-stack">{p.stack.join(" / ")}</div>}
          </div>
        </div>,
      );
    });
  }

  if (resume.education.length > 0) {
    atoms.push(
      <h2 className="bh-h2" data-keep-with-next="true" key="edu-h">
        <span className="bh-shape ring" />
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      atoms.push(
        <div className="bh-edu" key={`edu-${ed.id}`}>
          <div>
            <div className="bh-edu-title">{ed.degree}</div>
            <div className="bh-edu-school">
              {ed.school}
              {formatLocation(ed.location)}
            </div>
          </div>
          <div className="bh-edu-meta">{formatDateRange(ed.start, ed.end)}</div>
          {ed.detail && <div className="bh-edu-detail">{ed.detail}</div>}
        </div>,
      );
    });
  }

  // Recognition: 2-col grid — single atom preserves layout.
  if (resume.certifications.length > 0 || resume.awards.length > 0) {
    atoms.push(
      <div className="bh-two" key="rec">
        {resume.certifications.length > 0 && (
          <div>
            <h2 className="bh-h2">
              <span className="bh-shape halfdisc" />
              Certifications
            </h2>
            {resume.certifications.map((c) => (
              <div className="bh-item" key={c.id}>
                {certificationLink(c, <strong>{c.name}</strong>)}
                {c.issuer ? ` — ${c.issuer}` : ""}
                {c.year ? <span className="meta"> · {c.year}</span> : null}
              </div>
            ))}
          </div>
        )}
        {resume.awards.length > 0 && (
          <div>
            <h2 className="bh-h2">
              <span className="bh-shape bar" />
              Awards
            </h2>
            {resume.awards.map((a) => (
              <div className="bh-item" key={a.id}>
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

  if (resume.languages.length > 0) {
    atoms.push(
      <h2 className="bh-h2" data-keep-with-next="true" key="lang-h">
        <span className="bh-shape circle" />
        Languages
      </h2>,
      <div className="bh-chips" key="lang-v">
        {resume.languages.map((l) => (
          <span className="bh-chip accent" key={l.id}>
            {l.name}
            {l.level ? ` · ${l.level}` : ""}
          </span>
        ))}
      </div>,
    );
  }

  if (resume.tools.length > 0) {
    atoms.push(
      <h2 className="bh-h2" data-keep-with-next="true" key="tools-h">
        <span className="bh-shape square" />
        {resume.toolsLabel?.trim() || "Tools"}
      </h2>,
      <div className="bh-chips" key="tools-v">
        {resume.tools.map((t, i) => (
          // oxlint-disable-next-line jsx/no-array-index-key
          <span className="bh-chip" key={i}>
            {t}
          </span>
        ))}
      </div>,
    );
  }

  if (resume.interests.length > 0) {
    atoms.push(
      <h2 className="bh-h2" data-keep-with-next="true" key="int-h">
        <span className="bh-shape triangle" />
        {resume.interestsLabel?.trim() || "Interests"}
      </h2>,
      <div className="bh-chips" key="int-v">
        {resume.interests.map((t, i) => (
          // oxlint-disable-next-line jsx/no-array-index-key
          <span className="bh-chip" key={i}>
            {t}
          </span>
        ))}
      </div>,
    );
  }

  if (resume.extras.length > 0) {
    resume.extras.forEach((x) => {
      atoms.push(
        <div className="bh-kv" key={`extras-${x.id}`}>
          <strong>{x.label}:</strong> {x.value}
        </div>,
      );
    });
  }

  resume.custom
    .filter((c) => c.header.trim() && c.bullets.some((b) => b.trim()))
    .forEach((c) => {
      atoms.push(
        <h2 className="bh-h2" data-keep-with-next="true" key={`custom-h-${c.id}`}>
          <span className="bh-shape bar" />
          {c.header}
        </h2>,
      );
      if (c.bullets.length === 1) {
        atoms.push(
          <div className="bh-summary" key={`custom-p-${c.id}`}>
            <RichText value={c.bullets[0]} />
          </div>,
        );
      } else {
        pushSplitItem(atoms, {
          keyPrefix: `custom-${c.id}`,
          bullets: c.bullets,
          renderBullet: (bullet, i, total) => {
            const cls = [
              "bh-ul-bullet",
              i === 0 ? "bh-ul-bullet-first" : "",
              i === total - 1 ? "bh-ul-bullet-last" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <ul className={cls}>
                <li>
                  <RichText value={bullet} />
                </li>
              </ul>
            );
          },
        });
      }
    });

  return (
    <>
      <style>{css}</style>
      <PaginatedCanvas mainPaddingMm={[10, 10]} pageClassName="bh-root">
        {atoms}
      </PaginatedCanvas>
    </>
  );
});
