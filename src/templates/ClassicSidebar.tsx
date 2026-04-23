/**
 * Classic Sidebar template.
 *
 * Two-column layout with a tinted left-hand sidebar that carries the
 * profile, contact details, and supporting facts (skills, credentials,
 * languages, tools, interests, stats, extras). The main column owns the
 * summary, experience, education, projects, and custom sections. All
 * colours are driven by the `PrimaryPalette`.
 *
 * Uses `PaginatedCanvas` with the `sidebarAtoms` mechanism so BOTH
 * columns paginate against a strict 297mm page budget. Overflow in
 * either column flows to the next page's matching column; nothing is
 * hidden and the page can never stretch past A4.
 */

import { PaginatedCanvas } from "../components/PaginatedCanvas.tsx";
import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { findLogoIcon } from "../utils/logoIcons.ts";
import { RichText } from "../utils/richText.tsx";
import {
  certificationLink,
  contactIcon,
  formatDateRange,
  formatLocation,
  renderContactValue,
  splitSkills,
} from "./shared.tsx";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

const SIDEBAR_WIDTH_MM = 68;
const SIDEBAR_PAD_V = 12;
const SIDEBAR_PAD_H = 7;
const SIDEBAR_CONTENT_WIDTH_MM = SIDEBAR_WIDTH_MM - SIDEBAR_PAD_H * 2;

export function ClassicSidebar({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const css = `
    .cs-root { font-family: 'Geist', 'Inter', sans-serif; color: #1f2937; font-size: 9.2pt; line-height: 1.4; overflow-wrap: break-word; word-break: break-word; hyphens: auto; }
    .cs-sidebar { color: #1f2937; min-width: 0; }
    .cs-photo { width: 28mm; height: 28mm; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto 4mm; border: 2px solid ${palette.primary600}; }
    .cs-logo { width: 14mm; height: 14mm; border-radius: 4mm; background: ${palette.primary600}; color: ${palette.primaryText}; display: flex; align-items: center; justify-content: center; margin: 0 auto 3mm; }
    .cs-name { font-size: 17pt; font-weight: 700; color: #111827; line-height: 1.1; text-align: center; letter-spacing: 0.3px; overflow-wrap: break-word; }
    .cs-role { font-size: 9.5pt; color: ${palette.primary600}; font-weight: 600; margin-top: 3mm; letter-spacing: 0.5px; text-transform: uppercase; text-align: center; overflow-wrap: break-word; }
    .cs-divider { height: 2px; background: ${palette.primary600}; width: 18mm; margin: 5mm auto 6mm; border-radius: 2px; }
    .cs-cont-name { font-size: 10.5pt; font-weight: 700; color: #111827; letter-spacing: 0.3px; padding-bottom: 2mm; border-bottom: 1px solid ${palette.primary200}; margin-bottom: 4mm; overflow-wrap: break-word; }
    .cs-cont-name small { display: block; font-size: 7.6pt; color: ${palette.primary600}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 1mm; }
    .cs-h3 { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 1.1px; color: ${palette.primary600}; margin-bottom: 1.8mm; font-weight: 700; border-bottom: 1px solid ${palette.primary200}; padding-bottom: 1mm; }
    .cs-sb-atom { margin-bottom: 4mm; min-width: 0; }
    .cs-sb-atom:last-child { margin-bottom: 0; }
    .cs-contact { display: flex; align-items: flex-start; gap: 2mm; margin-bottom: 1.4mm; font-size: 8.1pt; overflow-wrap: anywhere; word-break: break-word; }
    .cs-contact .i { color: ${palette.primary600}; display: inline-flex; width: 5mm; justify-content: center; flex-shrink: 0; margin-top: 0.5mm; }
    .cs-contact > span:last-child { min-width: 0; flex: 1 1 auto; overflow-wrap: anywhere; word-break: break-word; }
    .cs-skill-group { margin-bottom: 2mm; }
    .cs-skill-group:last-child { margin-bottom: 0; }
    .cs-skill-label { font-size: 8pt; font-weight: 700; color: #111827; margin-bottom: 0.5mm; display: flex; align-items: center; gap: 1.5mm; overflow-wrap: break-word; }
    .cs-skill-icon { width: 1em; height: 1em; color: ${palette.primary600}; flex-shrink: 0; }
    .cs-skill-list { font-size: 7.8pt; color: #1e293b; line-height: 1.4; overflow-wrap: anywhere; word-break: break-word; }
    .cs-section-head { font-size: 10.5pt; color: #27272a; text-transform: uppercase; letter-spacing: 1.3px; font-weight: 700; margin: 5mm 0 2.5mm; padding-bottom: 1mm; border-bottom: 2px solid #27272a; position: relative; break-after: avoid; page-break-after: avoid; }
    .cs-summary-atom .cs-section-head { margin-top: 0; }
    .cs-section-head::after { content: ""; position: absolute; left: 0; bottom: -2px; width: 12mm; height: 2px; background: ${palette.primary600}; }
    .cs-summary { font-size: 9pt; line-height: 1.55; color: #1e293b; text-align: justify; hyphens: auto; overflow-wrap: break-word; }
    .cs-summary-atom { margin-bottom: 4mm; }
    .cs-job { margin-bottom: 2.8mm; page-break-inside: avoid; break-inside: avoid; }
    .cs-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; flex-wrap: wrap; }
    .cs-jobtitle { font-size: 9.6pt; font-weight: 700; color: #27272a; min-width: 0; flex: 1 1 auto; overflow-wrap: break-word; }
    .cs-jobmeta { font-size: 8.2pt; color: #6b7280; font-style: italic; flex-shrink: 0; font-variant-numeric: tabular-nums; }
    .cs-jobco { font-size: 8.8pt; color: ${palette.primary600}; font-weight: 600; margin-bottom: 1.2mm; overflow-wrap: break-word; }
    .cs-job ul { list-style: none; padding: 0; margin: 0; }
    .cs-job li { font-size: 8.7pt; line-height: 1.45; padding-left: 4mm; position: relative; margin-bottom: 0.8mm; overflow-wrap: break-word; }
    .cs-job li::before { content: "▸"; position: absolute; left: 0; color: ${palette.primary600}; font-weight: 700; }
    .cs-edu { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.5mm; gap: 4mm; flex-wrap: wrap; page-break-inside: avoid; break-inside: avoid; }
    .cs-edu > div:first-child { min-width: 0; flex: 1 1 auto; }
    .cs-edutitle { font-size: 9.4pt; font-weight: 700; color: #27272a; overflow-wrap: break-word; }
    .cs-eduschool { font-size: 8.8pt; color: ${palette.primary600}; font-weight: 600; overflow-wrap: break-word; }
    .cs-edumeta { font-size: 8.4pt; color: #6b7280; font-style: italic; flex-shrink: 0; text-align: right; }
    .cs-proj-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 2.8mm; margin-bottom: 2.8mm; }
    .cs-proj-grid:last-child { margin-bottom: 0; }
    .cs-proj { border: 1px solid #e5e7eb; border-left: 3px solid ${palette.primary600}; border-radius: 3px; padding: 2mm 2.5mm; background: #fafbfc; min-width: 0; page-break-inside: avoid; break-inside: avoid; }
    .cs-projname { font-size: 8.8pt; font-weight: 700; color: #27272a; margin-bottom: 0.8mm; overflow-wrap: break-word; }
    .cs-projdesc { font-size: 7.9pt; color: #4b5563; line-height: 1.4; margin-bottom: 1.2mm; overflow-wrap: break-word; }
    .cs-projrole { font-size: 7.8pt; color: #27272a; line-height: 1.4; margin-bottom: 1.2mm; overflow-wrap: break-word; }
    .cs-chips { display: flex; flex-wrap: wrap; gap: 1mm; }
    .cs-chip { background: ${palette.primary50}; border: 1px solid ${palette.primary200}; color: ${palette.primary900}; padding: 0.2mm 1.4mm; border-radius: 6px; font-size: 7.2pt; font-weight: 600; max-width: 100%; overflow-wrap: break-word; word-break: break-word; }
    .cs-cert { font-size: 8.2pt; margin-bottom: 1.6mm; overflow-wrap: break-word; }
    .cs-cert:last-child { margin-bottom: 0; }
    .cs-cert strong { color: #111827; display: block; overflow-wrap: break-word; }
    .cs-award { font-size: 8.2pt; margin-bottom: 1.6mm; overflow-wrap: break-word; }
    .cs-award:last-child { margin-bottom: 0; }
    .cs-award strong { color: #111827; display: block; overflow-wrap: break-word; }
    .cs-lang { display: flex; justify-content: space-between; gap: 2mm; font-size: 8.3pt; margin-bottom: 1mm; flex-wrap: wrap; }
    .cs-lang:last-child { margin-bottom: 0; }
    .cs-lang > span:first-child { min-width: 0; overflow-wrap: break-word; }
    .cs-lang .lvl { color: ${palette.primary600}; font-size: 7.8pt; flex-shrink: 0; }
    .cs-interests { display: flex; flex-wrap: wrap; gap: 1.5mm; }
    .cs-extrakv { font-size: 8.2pt; margin-bottom: 1.5mm; overflow-wrap: break-word; }
    .cs-extrakv:last-child { margin-bottom: 0; }
    .cs-extrakv strong { color: #111827; display: block; overflow-wrap: break-word; }
    .cs-stats p { line-height: 1.7; font-size: 8.3pt; overflow-wrap: break-word; }
    .cs-stats strong { color: #111827; }
  `;

  // ───── Sidebar atoms ─────
  // atom[0] is the identity block (photo/logo + name + role + divider).
  // Because the packer measures it directly, there is no "reserve"
  // heuristic to drift with font/name changes.
  const sidebarAtoms: React.ReactNode[] = [];

  sidebarAtoms.push(
    <div key="identity">
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
      {resume.profile.title && <div className="cs-role">{resume.profile.title}</div>}
      <div className="cs-divider" />
    </div>,
  );

  if (resume.contact.length > 0) {
    sidebarAtoms.push(
      <div className="cs-sb-atom" key="contact">
        <div className="cs-h3">Contact</div>
        {resume.contact.map((c) => (
          <div key={c.id} className="cs-contact">
            <span className="i">{contactIcon(c.kind, 10)}</span>
            <span>{renderContactValue(c)}</span>
          </div>
        ))}
      </div>,
    );
  }

  if (resume.skills.length > 0) {
    // One atom per skill group so long skill lists flow across pages at
    // group boundaries rather than relocating wholesale.
    resume.skills.forEach((group, idx) => {
      const GroupIcon = findLogoIcon(group.iconName)?.Icon;
      sidebarAtoms.push(
        <div className="cs-sb-atom" key={`skill-${group.id}`}>
          {idx === 0 && <div className="cs-h3">Core Expertise</div>}
          <div className="cs-skill-group">
            <div className="cs-skill-label">
              {GroupIcon && <GroupIcon className="cs-skill-icon" />}
              <span>{group.label}</span>
            </div>
            <div className="cs-skill-list">{splitSkills(group.items).join(", ")}</div>
          </div>
        </div>,
      );
    });
  }

  if (resume.certifications.length > 0) {
    sidebarAtoms.push(
      <div className="cs-sb-atom" key="certs">
        <div className="cs-h3">Certifications</div>
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
      </div>,
    );
  }

  if (resume.awards.length > 0) {
    sidebarAtoms.push(
      <div className="cs-sb-atom" key="awards">
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
      </div>,
    );
  }

  if (resume.languages.length > 0) {
    sidebarAtoms.push(
      <div className="cs-sb-atom" key="langs">
        <div className="cs-h3">Languages</div>
        {resume.languages.map((l) => (
          <div className="cs-lang" key={l.id}>
            <span>{l.name}</span>
            <span className="lvl">{l.level}</span>
          </div>
        ))}
      </div>,
    );
  }

  if (resume.tools.length > 0) {
    sidebarAtoms.push(
      <div className="cs-sb-atom" key="tools">
        <div className="cs-h3">{resume.toolsLabel?.trim() || "Tools I Use"}</div>
        <div className="cs-interests">
          {resume.tools.map((t, i) => (
            // oxlint-disable-next-line jsx/no-array-index-key
            <span className="cs-chip" key={i}>
              {t}
            </span>
          ))}
        </div>
      </div>,
    );
  }

  if (resume.interests.length > 0) {
    sidebarAtoms.push(
      <div className="cs-sb-atom" key="interests">
        <div className="cs-h3">{resume.interestsLabel?.trim() || "Interests"}</div>
        <div className="cs-interests">
          {resume.interests.map((t, i) => (
            // oxlint-disable-next-line jsx/no-array-index-key
            <span className="cs-chip" key={i}>
              {t}
            </span>
          ))}
        </div>
      </div>,
    );
  }

  if (resume.quickStats.length > 0) {
    sidebarAtoms.push(
      <div className="cs-sb-atom" key="stats">
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
      </div>,
    );
  }

  // One atom per extra so a long extras list packs tightly across pages.
  resume.extras.forEach((x, idx) => {
    sidebarAtoms.push(
      <div className="cs-sb-atom" key={`extra-${x.id}`}>
        {idx === 0 && <div className="cs-h3">Extras</div>}
        <div className="cs-extrakv">
          <strong>{x.label}</strong>
          {x.value}
        </div>
      </div>,
    );
  });

  // ───── Main atoms ─────
  const mainAtoms: React.ReactNode[] = [];

  if (resume.profile.summary) {
    mainAtoms.push(
      <div className="cs-summary-atom" key="summary">
        <h2 className="cs-section-head">Professional Summary</h2>
        <p className="cs-summary">
          <RichText value={resume.profile.summary} />
        </p>
      </div>,
    );
  }

  if (resume.experience.length > 0) {
    mainAtoms.push(
      <h2 className="cs-section-head" data-keep-with-next="true" key="exp-h">
        Work Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      mainAtoms.push(
        <div className="cs-job" key={`exp-${job.id}`}>
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
        </div>,
      );
    });
  }

  if (resume.education.length > 0) {
    mainAtoms.push(
      <h2 className="cs-section-head" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      mainAtoms.push(
        <div className="cs-edu" key={`edu-${ed.id}`}>
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
        </div>,
      );
    });
  }

  if (resume.projects.length > 0) {
    mainAtoms.push(
      <h2 className="cs-section-head" data-keep-with-next="true" key="proj-h">
        Key Projects
      </h2>,
    );
    // 2-col grid rendered as row-pair atoms so long project lists flow
    // across pages at row boundaries instead of moving the whole grid.
    const renderCard = (p: (typeof resume.projects)[number]) => (
      <div className="cs-proj" key={p.id}>
        <div className="cs-projname">{p.name}</div>
        <div className="cs-projdesc">
          <RichText value={p.description} />
        </div>
        {p.role && <div className="cs-projrole">{p.role}</div>}
        {p.stack.length > 0 && (
          <div className="cs-chips">
            {p.stack.map((s, i) => (
              // oxlint-disable-next-line jsx/no-array-index-key
              <span className="cs-chip" key={i}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    );
    for (let i = 0; i < resume.projects.length; i += 2) {
      const pair = resume.projects.slice(i, i + 2);
      mainAtoms.push(
        <div className="cs-proj-grid" key={`proj-row-${pair[0].id}`}>
          {pair.map(renderCard)}
        </div>,
      );
    }
  }

  resume.custom
    .filter((c) => c.header.trim() && c.bullets.some((b) => b.trim()))
    .forEach((c) => {
      mainAtoms.push(
        <h2 className="cs-section-head" data-keep-with-next="true" key={`custom-h-${c.id}`}>
          {c.header}
        </h2>,
      );
      if (c.bullets.length === 1) {
        mainAtoms.push(
          <p className="cs-summary" key={`custom-p-${c.id}`}>
            <RichText value={c.bullets[0]} />
          </p>,
        );
      } else {
        mainAtoms.push(
          <div className="cs-job" key={`custom-${c.id}`}>
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

  const renderSidebar = (
    pageIndex: number,
    _pageCount: number,
    atomsForPage: React.ReactNode[],
  ) => {
    if (atomsForPage.length === 0) return null;
    return (
      <>
        {pageIndex > 0 && (
          <div className="cs-cont-name">
            {resume.profile.name}
            {resume.profile.title && <small>{resume.profile.title}</small>}
          </div>
        )}
        {atomsForPage}
      </>
    );
  };

  return (
    <>
      <style>{css}</style>
      <PaginatedCanvas
        sidebar={renderSidebar}
        sidebarAtoms={sidebarAtoms}
        sidebarClassName="cs-sidebar"
        sidebarContentWidthMm={SIDEBAR_CONTENT_WIDTH_MM}
        sidebarWidthMm={SIDEBAR_WIDTH_MM}
        sidebarBackground={palette.primary50}
        sidebarPaddingMm={[SIDEBAR_PAD_V, SIDEBAR_PAD_H]}
        sidebarContinuationReserveMm={14}
        sidebarBottomBufferMm={6}
        mainPaddingMm={[10, 10]}
        pageClassName="cs-root"
      >
        {mainAtoms}
      </PaginatedCanvas>
    </>
  );
}
