/**
 * Prism template.
 *
 * A modern two-column layout with a solid accent-coloured sidebar
 * carrying identity and supporting facts in crisp white type, paired
 * with a clean white narrative column. Sidebar sections are marked with
 * small accent dots; main column headings ride an accent bar on the
 * left.
 *
 * Uses `PaginatedCanvas` with `sidebarAtoms` so both columns paginate
 * against a strict 297mm page budget. Sidebar or main overflow flows
 * onto later pages of the same column; nothing is hidden and the page
 * can never stretch past A4. Ideal for product, engineering, and data
 * leaders.
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

const SIDEBAR_WIDTH_MM = 72;
const SIDEBAR_PAD_V = 14;
const SIDEBAR_PAD_H = 8;
const SIDEBAR_CONTENT_WIDTH_MM = SIDEBAR_WIDTH_MM - SIDEBAR_PAD_H * 2;

export function Prism({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const initials = extractInitials(resume.profile.name);
  const css = `
    .pr-root { font-family: 'Geist', 'Inter', sans-serif; color: #0f172a; font-size: 9.3pt; line-height: 1.45; overflow-wrap: break-word; word-break: break-word; hyphens: auto; }
    .pr-sidebar { background: ${palette.primary800}; color: #f1f5f9; position: relative; min-width: 0; }
    .pr-sidebar::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2.5mm; background: ${palette.primary500}; }
    .pr-mono { width: 22mm; height: 22mm; border-radius: 50%; background: #ffffff; color: ${palette.primary800}; display: flex; align-items: center; justify-content: center; font-size: 12pt; font-weight: 800; letter-spacing: -0.3px; margin: 0 0 5mm; overflow: hidden; flex-shrink: 0; }
    .pr-mono img { width: 100%; height: 100%; object-fit: cover; }
    .pr-name { font-size: 20pt; font-weight: 800; color: #ffffff; line-height: 1.05; letter-spacing: -0.5px; margin: 0; overflow-wrap: break-word; }
    .pr-role { font-size: 8.4pt; color: ${palette.primary200}; font-weight: 700; margin-top: 2mm; letter-spacing: 1.8px; text-transform: uppercase; overflow-wrap: break-word; }
    .pr-rule { height: 2px; background: ${palette.primary400}; width: 12mm; margin: 5mm 0 0; }
    .pr-cont-name { font-size: 11pt; font-weight: 800; color: #ffffff; letter-spacing: -0.2px; padding-bottom: 2mm; margin-bottom: 5mm; border-bottom: 1px solid rgba(255,255,255,0.25); overflow-wrap: break-word; }
    .pr-cont-name small { display: block; font-size: 7.4pt; color: ${palette.primary200}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.6px; margin-top: 1mm; }
    .pr-h3 { font-size: 8pt; text-transform: uppercase; letter-spacing: 2.2px; color: #ffffff; font-weight: 800; margin-bottom: 2mm; display: flex; align-items: center; gap: 2mm; }
    .pr-h3::before { content: ""; width: 2mm; height: 2mm; background: ${palette.primary400}; border-radius: 50%; flex-shrink: 0; }
    .pr-sb-atom { margin-bottom: 4.5mm; min-width: 0; }
    .pr-sb-atom:last-child { margin-bottom: 0; }
    .pr-contact { display: flex; align-items: flex-start; gap: 2mm; margin-bottom: 1.4mm; font-size: 8.2pt; color: #cbd5e1; overflow-wrap: anywhere; word-break: break-word; }
    .pr-contact .i { color: ${palette.primary200}; display: inline-flex; width: 5mm; justify-content: center; flex-shrink: 0; margin-top: 0.5mm; }
    .pr-contact > span:last-child { min-width: 0; flex: 1 1 auto; overflow-wrap: anywhere; word-break: break-word; }
    .pr-skill-group { margin-bottom: 2.4mm; }
    .pr-skill-group:last-child { margin-bottom: 0; }
    .pr-skill-label { font-size: 8.2pt; font-weight: 700; color: #ffffff; margin-bottom: 0.4mm; display: flex; align-items: center; gap: 1.5mm; overflow-wrap: break-word; }
    .pr-skill-icon { width: 1em; height: 1em; color: ${palette.primary300}; flex-shrink: 0; }
    .pr-skill-list { font-size: 8pt; color: #cbd5e1; line-height: 1.45; overflow-wrap: anywhere; word-break: break-word; }
    .pr-lang { display: flex; justify-content: space-between; gap: 2mm; font-size: 8.2pt; margin-bottom: 1mm; color: #cbd5e1; padding-bottom: 0.8mm; border-bottom: 1px dotted rgba(255,255,255,0.18); flex-wrap: wrap; }
    .pr-lang:last-child { border-bottom: 0; }
    .pr-lang > span:first-child { min-width: 0; overflow-wrap: break-word; }
    .pr-lang .lvl { color: ${palette.primary200}; font-weight: 700; font-size: 7.8pt; flex-shrink: 0; }
    .pr-chips { display: flex; flex-wrap: wrap; gap: 1.2mm; }
    .pr-chip { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); color: #e2e8f0; padding: 0.3mm 1.8mm; border-radius: 999px; font-size: 7.6pt; font-weight: 600; max-width: 100%; overflow-wrap: break-word; word-break: break-word; }
    .pr-cert { font-size: 8.2pt; margin-bottom: 1.6mm; color: #cbd5e1; line-height: 1.4; overflow-wrap: break-word; }
    .pr-cert:last-child { margin-bottom: 0; }
    .pr-cert strong { color: #ffffff; display: block; font-weight: 700; overflow-wrap: break-word; }
    .pr-cert .meta { color: ${palette.primary200}; font-size: 7.8pt; overflow-wrap: break-word; }
    .pr-award { font-size: 8.2pt; margin-bottom: 1.6mm; color: #cbd5e1; line-height: 1.4; overflow-wrap: break-word; }
    .pr-award:last-child { margin-bottom: 0; }
    .pr-award strong { color: #ffffff; display: block; font-weight: 700; overflow-wrap: break-word; }
    .pr-stats { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.8mm; }
    .pr-stat { background: rgba(255,255,255,0.05); border-left: 2px solid ${palette.primary400}; padding: 1.8mm 2.2mm; border-radius: 1mm; min-width: 0; }
    .pr-stat-value { font-size: 12pt; font-weight: 800; color: #ffffff; line-height: 1; letter-spacing: -0.3px; overflow-wrap: break-word; }
    .pr-stat-label { font-size: 6.8pt; text-transform: uppercase; letter-spacing: 1.1px; color: ${palette.primary200}; font-weight: 700; margin-top: 0.6mm; overflow-wrap: break-word; }
    .pr-extra { font-size: 8pt; margin-bottom: 1.4mm; color: #cbd5e1; line-height: 1.4; overflow-wrap: break-word; }
    .pr-extra:last-child { margin-bottom: 0; }
    .pr-extra strong { display: block; color: #ffffff; font-weight: 700; font-size: 7.6pt; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.3mm; overflow-wrap: break-word; }
    .pr-section-head { font-size: 10pt; font-weight: 800; color: ${palette.primary800}; text-transform: uppercase; letter-spacing: 1.8px; margin: 6mm 0 3mm; padding-left: 3.5mm; position: relative; break-after: avoid; page-break-after: avoid; }
    .pr-summary-atom .pr-section-head { margin-top: 0; }
    .pr-section-head::before { content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 2mm; height: 70%; background: ${palette.primary600}; border-radius: 1px; }
    .pr-summary { font-size: 9.6pt; line-height: 1.6; color: #1e293b; overflow-wrap: break-word; }
    .pr-summary-atom { margin-bottom: 5mm; }
    .pr-job { margin-bottom: 3.8mm; page-break-inside: avoid; break-inside: avoid; }
    .pr-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; margin-bottom: 0.4mm; flex-wrap: wrap; }
    .pr-jobtitle { font-size: 10.2pt; font-weight: 700; color: #0f172a; letter-spacing: -0.1px; min-width: 0; flex: 1 1 auto; overflow-wrap: break-word; }
    .pr-jobdates { font-size: 8.4pt; color: ${palette.primary700}; font-weight: 700; font-variant-numeric: tabular-nums; flex-shrink: 0; }
    .pr-jobco { font-size: 9pt; color: ${palette.primary700}; font-weight: 600; margin-bottom: 1.4mm; overflow-wrap: break-word; }
    .pr-jobco .loc { color: #64748b; font-weight: 500; }
    .pr-job ul { list-style: none; padding: 0; margin: 0; }
    .pr-job li { font-size: 9pt; line-height: 1.5; padding-left: 4mm; position: relative; margin-bottom: 0.8mm; color: #1e293b; overflow-wrap: break-word; }
    .pr-job li::before { content: ""; position: absolute; left: 0; top: 1.8mm; width: 1.8mm; height: 1.8mm; background: ${palette.primary500}; border-radius: 50%; }
    .pr-edu { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2mm; gap: 4mm; flex-wrap: wrap; page-break-inside: avoid; break-inside: avoid; padding-bottom: 1.8mm; border-bottom: 1px solid #e2e8f0; }
    .pr-edu:last-child { border-bottom: 0; padding-bottom: 0; margin-bottom: 0; }
    .pr-edu > div:first-child { min-width: 0; flex: 1 1 auto; }
    .pr-edutitle { font-size: 9.6pt; font-weight: 700; color: #0f172a; overflow-wrap: break-word; }
    .pr-eduschool { font-size: 8.8pt; color: ${palette.primary700}; font-weight: 600; margin-top: 0.3mm; overflow-wrap: break-word; }
    .pr-edumeta { font-size: 8.4pt; color: #64748b; font-variant-numeric: tabular-nums; text-align: right; flex-shrink: 0; }
    .pr-edu-detail { font-size: 8pt; color: #64748b; font-style: italic; margin-top: 0.3mm; overflow-wrap: break-word; }
    .pr-proj { margin-bottom: 3mm; padding: 2.4mm 3mm; background: ${palette.primary50}; border-left: 2.5px solid ${palette.primary600}; border-radius: 0 2mm 2mm 0; page-break-inside: avoid; break-inside: avoid; }
    .pr-proj:last-child { margin-bottom: 0; }
    .pr-projname { font-size: 9.8pt; font-weight: 700; color: #0f172a; margin-bottom: 0.3mm; overflow-wrap: break-word; }
    .pr-projrole { font-size: 8.4pt; color: ${palette.primary700}; font-weight: 600; margin-bottom: 1mm; overflow-wrap: break-word; }
    .pr-projdesc { font-size: 8.8pt; color: #1e293b; line-height: 1.5; margin-bottom: 1mm; overflow-wrap: break-word; }
    .pr-projstack { font-size: 8.2pt; color: ${palette.primary700}; font-weight: 600; overflow-wrap: anywhere; }
  `;

  // ───── Sidebar atoms ─────
  const sidebarAtoms: React.ReactNode[] = [];

  sidebarAtoms.push(
    <div className="pr-sb-atom" key="identity">
      <div className="pr-mono">
        {resume.profile.photoUrl ? (
          <img src={resume.profile.photoUrl} alt={resume.profile.name} />
        ) : logo ? (
          <logo.Icon style={{ width: "12mm", height: "12mm" }} />
        ) : (
          initials || "—"
        )}
      </div>
      <h1 className="pr-name">{resume.profile.name}</h1>
      {resume.profile.title && <div className="pr-role">{resume.profile.title}</div>}
      <div className="pr-rule" />
    </div>,
  );

  if (resume.contact.length > 0) {
    sidebarAtoms.push(
      <div className="pr-sb-atom" key="contact">
        <div className="pr-h3">Contact</div>
        {resume.contact.map((c) => (
          <div key={c.id} className="pr-contact">
            <span className="i">{contactIcon(c.kind, 10)}</span>
            <span>{renderContactValue(c)}</span>
          </div>
        ))}
      </div>,
    );
  }

  if (resume.skills.length > 0) {
    resume.skills.forEach((group, idx) => {
      const GroupIcon = findLogoIcon(group.iconName)?.Icon;
      sidebarAtoms.push(
        <div className="pr-sb-atom" key={`skill-${group.id}`}>
          {idx === 0 && <div className="pr-h3">Expertise</div>}
          <div className="pr-skill-group">
            <div className="pr-skill-label">
              {GroupIcon && <GroupIcon className="pr-skill-icon" />}
              <span>{group.label}</span>
            </div>
            <div className="pr-skill-list">{splitSkills(group.items).join(" · ")}</div>
          </div>
        </div>,
      );
    });
  }

  if (resume.quickStats.length > 0) {
    sidebarAtoms.push(
      <div className="pr-sb-atom" key="stats">
        <div className="pr-h3">At a Glance</div>
        <div className="pr-stats">
          {resume.quickStats.map((s) => (
            <div className="pr-stat" key={s.id}>
              <div className="pr-stat-value">{s.value}</div>
              <div className="pr-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>,
    );
  }

  if (resume.certifications.length > 0) {
    sidebarAtoms.push(
      <div className="pr-sb-atom" key="certs">
        <div className="pr-h3">Certifications</div>
        {resume.certifications.map((c) => (
          <div className="pr-cert" key={c.id}>
            {certificationLink(c, <strong>{c.name}</strong>)}
            <span className="meta">
              {c.issuer}
              {c.year ? ` · ${c.year}` : ""}
            </span>
          </div>
        ))}
      </div>,
    );
  }

  if (resume.awards.length > 0) {
    sidebarAtoms.push(
      <div className="pr-sb-atom" key="awards">
        <div className="pr-h3">Awards</div>
        {resume.awards.map((a) => (
          <div className="pr-award" key={a.id}>
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
      <div className="pr-sb-atom" key="langs">
        <div className="pr-h3">Languages</div>
        {resume.languages.map((l) => (
          <div className="pr-lang" key={l.id}>
            <span>{l.name}</span>
            {l.level && <span className="lvl">{l.level}</span>}
          </div>
        ))}
      </div>,
    );
  }

  if (resume.tools.length > 0) {
    sidebarAtoms.push(
      <div className="pr-sb-atom" key="tools">
        <div className="pr-h3">{resume.toolsLabel?.trim() || "Tools"}</div>
        <div className="pr-chips">
          {resume.tools.map((t, i) => (
            // oxlint-disable-next-line jsx/no-array-index-key
            <span className="pr-chip" key={i}>
              {t}
            </span>
          ))}
        </div>
      </div>,
    );
  }

  if (resume.interests.length > 0) {
    sidebarAtoms.push(
      <div className="pr-sb-atom" key="interests">
        <div className="pr-h3">{resume.interestsLabel?.trim() || "Interests"}</div>
        <div className="pr-chips">
          {resume.interests.map((t, i) => (
            // oxlint-disable-next-line jsx/no-array-index-key
            <span className="pr-chip" key={i}>
              {t}
            </span>
          ))}
        </div>
      </div>,
    );
  }

  resume.extras.forEach((x, idx) => {
    sidebarAtoms.push(
      <div className="pr-sb-atom" key={`extra-${x.id}`}>
        {idx === 0 && <div className="pr-h3">Extras</div>}
        <div className="pr-extra">
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
      <div className="pr-summary-atom" key="summary">
        <h2 className="pr-section-head">Profile</h2>
        <p className="pr-summary">
          <RichText value={resume.profile.summary} />
        </p>
      </div>,
    );
  }

  if (resume.experience.length > 0) {
    mainAtoms.push(
      <h2 className="pr-section-head" data-keep-with-next="true" key="exp-h">
        Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      mainAtoms.push(
        <div className="pr-job" key={`exp-${job.id}`}>
          <div className="pr-jobhead">
            <div className="pr-jobtitle">{job.title}</div>
            <div className="pr-jobdates">{formatDateRange(job.start, job.end)}</div>
          </div>
          <div className="pr-jobco">
            {job.company}
            {job.location ? <span className="loc"> · {job.location}</span> : null}
          </div>
          <ul>
            {job.bullets.map((b, i) => (
              // oxlint-disable-next-line jsx/no-array-index-key
              <li key={`${job.id}-b-${i}`}>
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
      <h2 className="pr-section-head" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      mainAtoms.push(
        <div className="pr-edu" key={`edu-${ed.id}`}>
          <div>
            <div className="pr-edutitle">{ed.degree}</div>
            <div className="pr-eduschool">
              {ed.school}
              {formatLocation(ed.location)}
            </div>
            {ed.detail && <div className="pr-edu-detail">{ed.detail}</div>}
          </div>
          <div className="pr-edumeta">{formatDateRange(ed.start, ed.end)}</div>
        </div>,
      );
    });
  }

  if (resume.projects.length > 0) {
    mainAtoms.push(
      <h2 className="pr-section-head" data-keep-with-next="true" key="proj-h">
        Projects
      </h2>,
    );
    resume.projects.forEach((p) => {
      mainAtoms.push(
        <div className="pr-proj" key={`proj-${p.id}`}>
          <div className="pr-projname">{p.name}</div>
          {p.role && <div className="pr-projrole">{p.role}</div>}
          {p.description && (
            <div className="pr-projdesc">
              <RichText value={p.description} />
            </div>
          )}
          {p.stack.length > 0 && <div className="pr-projstack">{p.stack.join(" · ")}</div>}
        </div>,
      );
    });
  }

  resume.custom
    .filter((c) => c.header.trim() && c.bullets.some((b) => b.trim()))
    .forEach((c) => {
      mainAtoms.push(
        <h2 className="pr-section-head" data-keep-with-next="true" key={`custom-h-${c.id}`}>
          {c.header}
        </h2>,
      );
      if (c.bullets.length === 1) {
        mainAtoms.push(
          <p className="pr-summary" key={`custom-p-${c.id}`}>
            <RichText value={c.bullets[0]} />
          </p>,
        );
      } else {
        mainAtoms.push(
          <div className="pr-job" key={`custom-${c.id}`}>
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
          <div className="pr-cont-name">
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
        sidebarClassName="pr-sidebar"
        sidebarContentWidthMm={SIDEBAR_CONTENT_WIDTH_MM}
        sidebarWidthMm={SIDEBAR_WIDTH_MM}
        sidebarBackground={palette.primary800}
        sidebarPaddingMm={[SIDEBAR_PAD_V, SIDEBAR_PAD_H]}
        sidebarContinuationReserveMm={15}
        sidebarBottomBufferMm={6}
        mainPaddingMm={[14, 12]}
        pageClassName="pr-root"
      >
        {mainAtoms}
      </PaginatedCanvas>
    </>
  );
}
