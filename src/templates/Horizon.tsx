/**
 * Horizon template.
 *
 * A light, modern two-column layout with a near-white sidebar and a
 * subtle accent rail along the column seam. Sidebar section headers
 * are rendered as soft pill badges with a small accent dot; main
 * column headers pair a rounded accent square with a hairline rule.
 * Experience entries use a gentle timeline treatment, and projects
 * render as minimally-bordered cards with an accent left edge.
 *
 * Uses `PaginatedCanvas` with `sidebarAtoms` so both columns paginate
 * against a strict 297mm page budget. Sidebar or main overflow flows
 * onto later pages of the same column; nothing is hidden and the page
 * can never stretch past A4. Built for design, product, and tech
 * professionals who want a polished, airy aesthetic.
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

const SIDEBAR_WIDTH_MM = 70;
const SIDEBAR_PAD_V = 12;
const SIDEBAR_PAD_H = 8;
const SIDEBAR_CONTENT_WIDTH_MM = SIDEBAR_WIDTH_MM - SIDEBAR_PAD_H * 2;
const SIDEBAR_BG = "#fafafa";

export const Horizon = memo(function Horizon({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const initials = extractInitials(resume.profile.name);
  const css = `
    .hz-root { font-family: 'Geist', 'Inter', sans-serif; color: #111827; font-size: 9.3pt; line-height: 1.48; overflow-wrap: break-word; word-break: break-word; hyphens: auto; }
    .hz-sidebar { background: ${SIDEBAR_BG}; color: #111827; position: relative; min-width: 0; }
    .hz-sidebar::after { content: ""; position: absolute; right: 0; top: 0; bottom: 0; width: 0.8mm; background: linear-gradient(to bottom, ${palette.primary300}, ${palette.primary600}); }
    .hz-identity { text-align: center; padding-bottom: 3.2mm; margin-bottom: 4mm; border-bottom: 1px solid ${palette.primary100}; }
    .hz-mono { width: 22mm; height: 22mm; border-radius: 5.5mm; background: linear-gradient(135deg, ${palette.primary50}, ${palette.primary200}); color: ${palette.primary800}; display: flex; align-items: center; justify-content: center; margin: 0 auto 3mm; font-size: 12pt; font-weight: 800; letter-spacing: -0.3px; overflow: hidden; border: 1px solid ${palette.primary200}; flex-shrink: 0; }
    .hz-mono img { width: 100%; height: 100%; object-fit: cover; }
    .hz-name { font-size: 17pt; font-weight: 700; color: #0f172a; line-height: 1.1; letter-spacing: -0.4px; margin: 0; overflow-wrap: break-word; }
    .hz-role { font-size: 8.4pt; color: ${palette.primary700}; font-weight: 700; margin-top: 1.6mm; letter-spacing: 1.4px; text-transform: uppercase; overflow-wrap: break-word; }
    .hz-cont-name { padding-bottom: 1.8mm; margin-bottom: 4mm; border-bottom: 1px solid ${palette.primary100}; text-align: center; overflow-wrap: break-word; }
    .hz-cont-name strong { display: block; font-size: 11pt; font-weight: 700; color: #0f172a; letter-spacing: -0.2px; }
    .hz-cont-name small { display: block; font-size: 7.4pt; color: ${palette.primary700}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 0.8mm; }
    .hz-h3 { display: block; font-size: 7.8pt; text-transform: uppercase; letter-spacing: 2.2px; font-weight: 800; color: #0f172a; margin-bottom: 2.2mm; padding-bottom: 1.2mm; position: relative; overflow-wrap: break-word; }
    .hz-h3::after { content: ""; position: absolute; left: 0; bottom: 0; width: 6mm; height: 1mm; background: ${palette.primary600}; border-radius: 0.5mm; }
    .hz-sb-atom { margin-bottom: 4.4mm; min-width: 0; }
    .hz-contact { display: flex; align-items: flex-start; gap: 2mm; margin-bottom: 1.2mm; font-size: 8.2pt; color: #374151; overflow-wrap: anywhere; word-break: break-word; }
    .hz-contact .i { color: ${palette.primary600}; display: inline-flex; width: 5mm; justify-content: center; flex-shrink: 0; margin-top: 0.4mm; }
    .hz-contact > span:last-child { min-width: 0; flex: 1 1 auto; overflow-wrap: anywhere; word-break: break-word; }
    .hz-skill-group { margin-bottom: 2mm; }
    .hz-skill-group:last-child { margin-bottom: 0; }
    .hz-skill-label { font-size: 8.4pt; font-weight: 700; color: #0f172a; margin-bottom: 0.4mm; display: flex; align-items: center; gap: 1.5mm; overflow-wrap: break-word; }
    .hz-skill-icon { width: 1em; height: 1em; color: ${palette.primary600}; flex-shrink: 0; }
    .hz-skill-list { font-size: 8.1pt; color: #374151; line-height: 1.45; overflow-wrap: anywhere; word-break: break-word; }
    .hz-lang { display: flex; justify-content: space-between; gap: 2mm; font-size: 8.2pt; margin-bottom: 0.9mm; color: #374151; padding-bottom: 0.8mm; border-bottom: 1px dashed ${palette.primary200}; flex-wrap: wrap; }
    .hz-lang:last-child { border-bottom: 0; padding-bottom: 0; margin-bottom: 0; }
    .hz-lang > span:first-child { min-width: 0; overflow-wrap: break-word; color: #0f172a; font-weight: 600; }
    .hz-lang .lvl { color: ${palette.primary700}; font-weight: 600; font-size: 7.8pt; flex-shrink: 0; }
    .hz-chips { display: flex; flex-wrap: wrap; gap: 1.1mm; }
    .hz-chip { background: #ffffff; border: 1px solid ${palette.primary200}; color: ${palette.primary900}; padding: 0.3mm 1.8mm; border-radius: 999px; font-size: 7.6pt; font-weight: 600; max-width: 100%; overflow-wrap: break-word; word-break: break-word; }
    .hz-cert { font-size: 8.2pt; margin-bottom: 1.4mm; color: #374151; line-height: 1.35; overflow-wrap: break-word; }
    .hz-cert:last-child { margin-bottom: 0; }
    .hz-cert strong { color: #0f172a; display: block; font-weight: 700; overflow-wrap: break-word; }
    .hz-cert .meta { color: ${palette.primary700}; font-size: 7.8pt; overflow-wrap: break-word; }
    .hz-award { font-size: 8.2pt; margin-bottom: 1.4mm; color: #374151; line-height: 1.35; overflow-wrap: break-word; }
    .hz-award:last-child { margin-bottom: 0; }
    .hz-award strong { color: #0f172a; display: block; font-weight: 700; overflow-wrap: break-word; }
    .hz-stats { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.4mm; }
    .hz-stat { background: #ffffff; border: 1px solid ${palette.primary100}; border-left: 2.5px solid ${palette.primary600}; padding: 1.4mm 2.2mm; border-radius: 0 2mm 2mm 0; min-width: 0; }
    .hz-stat-value { font-size: 12pt; font-weight: 800; color: ${palette.primary800}; line-height: 1; letter-spacing: -0.3px; overflow-wrap: break-word; font-variant-numeric: tabular-nums; }
    .hz-stat-label { font-size: 6.8pt; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 700; margin-top: 0.5mm; overflow-wrap: break-word; }
    .hz-extra { font-size: 8pt; margin-bottom: 1.4mm; color: #374151; line-height: 1.4; overflow-wrap: break-word; }
    .hz-extra:last-child { margin-bottom: 0; }
    .hz-extra strong { display: block; color: #0f172a; font-weight: 700; font-size: 7.6pt; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 0.3mm; overflow-wrap: break-word; }
    .hz-section-head { font-size: 11pt; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; margin: 4.8mm 0 2.4mm; display: flex; align-items: center; gap: 2.4mm; break-after: avoid; page-break-after: avoid; }
    .hz-summary-atom .hz-section-head { margin-top: 0; }
    .hz-section-head::before { content: ""; width: 2.6mm; height: 2.6mm; background: ${palette.primary600}; border-radius: 0.8mm; flex-shrink: 0; }
    .hz-section-head::after { content: ""; flex: 1 1 auto; height: 1px; background: linear-gradient(to right, ${palette.primary200}, transparent); }
    .hz-summary { font-size: 9.4pt; line-height: 1.55; color: #1f2937; overflow-wrap: break-word; }
    .hz-summary-atom { margin-bottom: 3.6mm; }
    .hz-job { margin-bottom: 2.8mm; padding-left: 5mm; position: relative; page-break-inside: avoid; break-inside: avoid; }
    .hz-job::before { content: ""; position: absolute; left: 1.2mm; top: 3.2mm; bottom: 0.4mm; width: 1px; background: ${palette.primary200}; }
    .hz-job::after { content: ""; position: absolute; left: 0; top: 1.6mm; width: 2.6mm; height: 2.6mm; background: ${palette.primary600}; border-radius: 50%; border: 2px solid ${SIDEBAR_BG}; box-shadow: 0 0 0 1px ${palette.primary600}; }
    .hz-job:last-child::before { display: none; }
    .hz-job-head { margin-bottom: 0; }
    .hz-job-head::before { bottom: 0; }
    .hz-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; flex-wrap: wrap; }
    .hz-jobtitle { font-size: 10.2pt; font-weight: 700; color: #0f172a; letter-spacing: -0.1px; min-width: 0; flex: 1 1 auto; overflow-wrap: break-word; }
    .hz-jobdates { font-size: 8.4pt; color: ${palette.primary700}; font-weight: 700; font-variant-numeric: tabular-nums; flex-shrink: 0; }
    .hz-jobco { font-size: 9pt; color: ${palette.primary700}; font-weight: 600; margin-bottom: 1.1mm; overflow-wrap: break-word; }
    .hz-jobco .loc { color: #6b7280; font-weight: 500; }
    .hz-job ul { list-style: none; padding: 0; margin: 0; }
    .hz-job li { font-size: 9pt; line-height: 1.45; padding-left: 3.8mm; position: relative; margin-bottom: 0.5mm; color: #1f2937; overflow-wrap: break-word; }
    .hz-job li::before { content: ""; position: absolute; left: 0; top: 2mm; width: 2mm; height: 1px; background: ${palette.primary600}; }
    .hz-ul-bullet { list-style: none; padding: 0 0 0 5mm; margin: 0; position: relative; }
    .hz-ul-bullet::before { content: ""; position: absolute; left: 1.2mm; top: 0; bottom: 0; width: 1px; background: ${palette.primary200}; }
    .hz-ul-bullet li { font-size: 9pt; line-height: 1.45; padding-left: 3.8mm; position: relative; margin-bottom: 0.5mm; color: #1f2937; overflow-wrap: break-word; }
    .hz-ul-bullet li::before { content: ""; position: absolute; left: 0; top: 2mm; width: 2mm; height: 1px; background: ${palette.primary600}; }
    .hz-ul-bullet-first { margin-top: 0; }
    .hz-ul-bullet-last { margin-bottom: 2.8mm; }
    .hz-ul-bullet-last::before { bottom: 0.4mm; }
    .hz-edu { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.6mm; gap: 4mm; flex-wrap: wrap; padding-bottom: 1.6mm; border-bottom: 1px solid ${palette.primary100}; page-break-inside: avoid; break-inside: avoid; }
    .hz-edu:last-child { border-bottom: 0; padding-bottom: 0; margin-bottom: 0; }
    .hz-edu > div:first-child { min-width: 0; flex: 1 1 auto; }
    .hz-edutitle { font-size: 9.6pt; font-weight: 700; color: #0f172a; overflow-wrap: break-word; }
    .hz-eduschool { font-size: 8.8pt; color: ${palette.primary700}; font-weight: 600; margin-top: 0.3mm; overflow-wrap: break-word; }
    .hz-edu-detail { font-size: 8pt; color: #6b7280; font-style: italic; margin-top: 0.3mm; overflow-wrap: break-word; }
    .hz-edumeta { font-size: 8.4pt; color: #6b7280; font-variant-numeric: tabular-nums; text-align: right; flex-shrink: 0; }
    .hz-proj { margin-bottom: 2.4mm; padding: 2.2mm 3mm 2.2mm 3.8mm; background: #ffffff; border: 1px solid ${palette.primary100}; border-radius: 2.5mm; position: relative; overflow: hidden; page-break-inside: avoid; break-inside: avoid; }
    .hz-proj::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 1.2mm; background: linear-gradient(to bottom, ${palette.primary400}, ${palette.primary600}); }
    .hz-proj:last-child { margin-bottom: 0; }
    .hz-projname { font-size: 9.8pt; font-weight: 700; color: #0f172a; margin-bottom: 0.2mm; overflow-wrap: break-word; }
    .hz-projrole { font-size: 8.4pt; color: ${palette.primary700}; font-weight: 600; margin-bottom: 0.8mm; overflow-wrap: break-word; }
    .hz-projdesc { font-size: 8.8pt; color: #1f2937; line-height: 1.45; margin-bottom: 0.8mm; overflow-wrap: break-word; }
    .hz-projstack { font-size: 8.2pt; color: ${palette.primary700}; font-weight: 600; overflow-wrap: anywhere; }
  `;

  // ───── Sidebar atoms ─────
  const sidebarAtoms: React.ReactNode[] = [];

  sidebarAtoms.push(
    <div className="hz-identity" key="identity">
      <div className="hz-mono">
        {resume.profile.photoUrl ? (
          <img src={resume.profile.photoUrl} alt={resume.profile.name} />
        ) : logo ? (
          <logo.Icon style={{ width: "12mm", height: "12mm" }} />
        ) : (
          initials || "—"
        )}
      </div>
      <h1 className="hz-name">{resume.profile.name}</h1>
      {resume.profile.title && <div className="hz-role">{resume.profile.title}</div>}
    </div>,
  );

  if (resume.contact.length > 0) {
    sidebarAtoms.push(
      <div className="hz-sb-atom" key="contact">
        <div className="hz-h3">Contact</div>
        {resume.contact.map((c) => (
          <div key={c.id} className="hz-contact">
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
        <div className="hz-sb-atom" key={`skill-${group.id}`}>
          {idx === 0 && <div className="hz-h3">Expertise</div>}
          <div className="hz-skill-group">
            <div className="hz-skill-label">
              {GroupIcon && <GroupIcon className="hz-skill-icon" />}
              <span>{group.label}</span>
            </div>
            <div className="hz-skill-list">{splitSkills(group.items).join(" · ")}</div>
          </div>
        </div>,
      );
    });
  }

  if (resume.quickStats.length > 0) {
    sidebarAtoms.push(
      <div className="hz-sb-atom" key="stats">
        <div className="hz-h3">At a Glance</div>
        <div className="hz-stats">
          {resume.quickStats.map((s) => (
            <div className="hz-stat" key={s.id}>
              <div className="hz-stat-value">{s.value}</div>
              <div className="hz-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>,
    );
  }

  if (resume.certifications.length > 0) {
    sidebarAtoms.push(
      <div className="hz-sb-atom" key="certs">
        <div className="hz-h3">Certifications</div>
        {resume.certifications.map((c) => (
          <div className="hz-cert" key={c.id}>
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
      <div className="hz-sb-atom" key="awards">
        <div className="hz-h3">Awards</div>
        {resume.awards.map((a) => (
          <div className="hz-award" key={a.id}>
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
      <div className="hz-sb-atom" key="langs">
        <div className="hz-h3">Languages</div>
        {resume.languages.map((l) => (
          <div className="hz-lang" key={l.id}>
            <span>{l.name}</span>
            {l.level && <span className="lvl">{l.level}</span>}
          </div>
        ))}
      </div>,
    );
  }

  if (resume.tools.length > 0) {
    sidebarAtoms.push(
      <div className="hz-sb-atom" key="tools">
        <div className="hz-h3">{resume.toolsLabel?.trim() || "Tools"}</div>
        <div className="hz-chips">
          {resume.tools.map((t, i) => (
            // oxlint-disable-next-line jsx/no-array-index-key
            <span className="hz-chip" key={i}>
              {t}
            </span>
          ))}
        </div>
      </div>,
    );
  }

  if (resume.interests.length > 0) {
    sidebarAtoms.push(
      <div className="hz-sb-atom" key="interests">
        <div className="hz-h3">{resume.interestsLabel?.trim() || "Interests"}</div>
        <div className="hz-chips">
          {resume.interests.map((t, i) => (
            // oxlint-disable-next-line jsx/no-array-index-key
            <span className="hz-chip" key={i}>
              {t}
            </span>
          ))}
        </div>
      </div>,
    );
  }

  resume.extras.forEach((x, idx) => {
    sidebarAtoms.push(
      <div className="hz-sb-atom" key={`extra-${x.id}`}>
        {idx === 0 && <div className="hz-h3">Extras</div>}
        <div className="hz-extra">
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
      <div className="hz-summary-atom" key="summary">
        <h2 className="hz-section-head">Profile</h2>
        <p className="hz-summary">
          <RichText value={resume.profile.summary} />
        </p>
      </div>,
    );
  }

  if (resume.experience.length > 0) {
    mainAtoms.push(
      <h2 className="hz-section-head" data-keep-with-next="true" key="exp-h">
        Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      const head = (
        <div className="hz-job hz-job-head" key={`exp-${job.id}-head-inner`}>
          <div className="hz-jobhead">
            <div className="hz-jobtitle">{job.title}</div>
            <div className="hz-jobdates">{formatDateRange(job.start, job.end)}</div>
          </div>
          <div className="hz-jobco">
            {job.company}
            {job.location ? <span className="loc"> · {job.location}</span> : null}
          </div>
        </div>
      );
      if (job.bullets.length === 0) {
        mainAtoms.push(
          <div className="hz-job" key={`exp-${job.id}`}>
            <div className="hz-jobhead">
              <div className="hz-jobtitle">{job.title}</div>
              <div className="hz-jobdates">{formatDateRange(job.start, job.end)}</div>
            </div>
            <div className="hz-jobco">
              {job.company}
              {job.location ? <span className="loc"> · {job.location}</span> : null}
            </div>
          </div>,
        );
        return;
      }
      pushSplitItem(mainAtoms, {
        keyPrefix: `exp-${job.id}`,
        renderHead: () => head,
        bullets: job.bullets,
        renderBullet: (bullet, i, total) => {
          const cls = [
            "hz-ul-bullet",
            i === 0 ? "hz-ul-bullet-first" : "",
            i === total - 1 ? "hz-ul-bullet-last" : "",
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

  if (resume.education.length > 0) {
    mainAtoms.push(
      <h2 className="hz-section-head" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      mainAtoms.push(
        <div className="hz-edu" key={`edu-${ed.id}`}>
          <div>
            <div className="hz-edutitle">{ed.degree}</div>
            <div className="hz-eduschool">
              {ed.school}
              {formatLocation(ed.location)}
            </div>
            {ed.detail && <div className="hz-edu-detail">{ed.detail}</div>}
          </div>
          <div className="hz-edumeta">{formatDateRange(ed.start, ed.end)}</div>
        </div>,
      );
    });
  }

  if (resume.projects.length > 0) {
    mainAtoms.push(
      <h2 className="hz-section-head" data-keep-with-next="true" key="proj-h">
        Projects
      </h2>,
    );
    resume.projects.forEach((p) => {
      mainAtoms.push(
        <div className="hz-proj" key={`proj-${p.id}`}>
          <div className="hz-projname">{p.name}</div>
          {p.role && <div className="hz-projrole">{p.role}</div>}
          {p.description && (
            <div className="hz-projdesc">
              <RichText value={p.description} />
            </div>
          )}
          {p.stack.length > 0 && <div className="hz-projstack">{p.stack.join(" · ")}</div>}
        </div>,
      );
    });
  }

  resume.custom
    .filter((c) => c.header.trim() && c.bullets.some((b) => b.trim()))
    .forEach((c) => {
      mainAtoms.push(
        <h2 className="hz-section-head" data-keep-with-next="true" key={`custom-h-${c.id}`}>
          {c.header}
        </h2>,
      );
      if (c.bullets.length === 1) {
        mainAtoms.push(
          <p className="hz-summary" key={`custom-p-${c.id}`}>
            <RichText value={c.bullets[0]} />
          </p>,
        );
      } else {
        pushSplitItem(mainAtoms, {
          keyPrefix: `custom-${c.id}`,
          bullets: c.bullets,
          renderBullet: (bullet, i, total) => {
            const cls = [
              "hz-ul-bullet",
              i === 0 ? "hz-ul-bullet-first" : "",
              i === total - 1 ? "hz-ul-bullet-last" : "",
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

  const renderSidebar = (
    pageIndex: number,
    _pageCount: number,
    atomsForPage: React.ReactNode[],
  ) => {
    if (atomsForPage.length === 0) return null;
    return (
      <>
        {pageIndex > 0 && (
          <div className="hz-cont-name">
            <strong>{resume.profile.name}</strong>
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
        sidebarClassName="hz-sidebar"
        sidebarContentWidthMm={SIDEBAR_CONTENT_WIDTH_MM}
        sidebarWidthMm={SIDEBAR_WIDTH_MM}
        sidebarBackground={SIDEBAR_BG}
        sidebarPaddingMm={[SIDEBAR_PAD_V, SIDEBAR_PAD_H]}
        sidebarContinuationReserveMm={13}
        sidebarBottomBufferMm={4}
        mainPaddingMm={[12, 11]}
        pageClassName="hz-root"
      >
        {mainAtoms}
      </PaginatedCanvas>
    </>
  );
});
