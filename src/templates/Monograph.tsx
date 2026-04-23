/**
 * Monograph template.
 *
 * An editorial, serif-dominant sidebar layout. A warm tinted sidebar
 * carries a monogram/photo, serif name, and supporting facts; the main
 * column owns the narrative in a restrained sans body. The tone reads
 * like a masthead rather than a banner — ideal for senior professionals,
 * consultants, and legal roles.
 *
 * Uses `PaginatedCanvas` with `sidebarAtoms` so both columns paginate
 * against a strict 297mm page budget. Sidebar or main overflow flows
 * onto later pages of the same column; nothing is hidden and the page
 * can never stretch past A4.
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

const SIDEBAR_WIDTH_MM = 62;
const SIDEBAR_PAD_V = 14;
const SIDEBAR_PAD_H = 7;
const SIDEBAR_CONTENT_WIDTH_MM = SIDEBAR_WIDTH_MM - SIDEBAR_PAD_H * 2;

export function Monograph({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const css = `
    .mg-root { font-family: 'Geist', 'Inter', sans-serif; color: #1c1917; font-size: 9.3pt; line-height: 1.5; overflow-wrap: break-word; word-break: break-word; hyphens: auto; }
    .mg-sidebar { background: ${palette.primary50}; color: #1c1917; border-right: 1px solid ${palette.primary200}; min-width: 0; }
    .mg-photo { width: 30mm; height: 30mm; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto 4mm; border: 1px solid ${palette.primary700}; }
    .mg-logo { width: 16mm; height: 16mm; border-radius: 50%; background: transparent; color: ${palette.primary700}; display: flex; align-items: center; justify-content: center; margin: 0 auto 3mm; border: 1px solid ${palette.primary700}; }
    .mg-name { font-family: 'Instrument Serif', 'Iowan Old Style', Georgia, serif; font-size: 21pt; font-weight: 400; color: #1c1917; line-height: 1.05; text-align: center; letter-spacing: 0.2px; margin: 0; overflow-wrap: break-word; }
    .mg-role { font-size: 8.4pt; color: #57534e; font-weight: 500; margin-top: 2.4mm; letter-spacing: 2px; text-transform: uppercase; text-align: center; overflow-wrap: break-word; }
    .mg-orn { height: 1px; background: ${palette.primary700}; width: 14mm; margin: 5mm auto 0; }
    .mg-cont-name { font-family: 'Instrument Serif', 'Iowan Old Style', Georgia, serif; font-size: 13pt; font-weight: 400; color: #1c1917; text-align: center; padding-bottom: 2mm; margin-bottom: 5mm; border-bottom: 1px solid ${palette.primary300}; overflow-wrap: break-word; }
    .mg-cont-name small { display: block; font-family: 'Geist', 'Inter', sans-serif; font-size: 7.2pt; color: #57534e; font-weight: 500; letter-spacing: 1.6px; text-transform: uppercase; margin-top: 1mm; }
    .mg-h3 { font-family: 'Instrument Serif', 'Iowan Old Style', Georgia, serif; font-size: 11pt; font-weight: 400; font-style: italic; color: #1c1917; margin-bottom: 2mm; padding-bottom: 1mm; border-bottom: 1px solid ${palette.primary300}; }
    .mg-sb-atom { margin-bottom: 4.5mm; min-width: 0; }
    .mg-sb-atom:last-child { margin-bottom: 0; }
    .mg-contact { display: flex; align-items: flex-start; gap: 2mm; margin-bottom: 1.4mm; font-size: 8.2pt; overflow-wrap: anywhere; word-break: break-word; }
    .mg-contact .i { color: ${palette.primary700}; display: inline-flex; width: 5mm; justify-content: center; flex-shrink: 0; margin-top: 0.5mm; }
    .mg-contact > span:last-child { min-width: 0; flex: 1 1 auto; overflow-wrap: anywhere; word-break: break-word; }
    .mg-skill-group { margin-bottom: 2.2mm; }
    .mg-skill-group:last-child { margin-bottom: 0; }
    .mg-skill-label { font-size: 8.2pt; font-weight: 700; color: #1c1917; display: flex; align-items: center; gap: 1.5mm; margin-bottom: 0.4mm; font-variant: small-caps; letter-spacing: 0.4px; overflow-wrap: break-word; }
    .mg-skill-icon { width: 1em; height: 1em; color: ${palette.primary700}; flex-shrink: 0; }
    .mg-skill-list { font-size: 8.2pt; color: #292524; line-height: 1.5; overflow-wrap: anywhere; word-break: break-word; }
    .mg-section-head { font-family: 'Instrument Serif', 'Iowan Old Style', Georgia, serif; font-size: 15pt; font-weight: 400; color: #1c1917; margin: 6mm 0 3mm; padding-bottom: 1.5mm; border-bottom: 1px solid ${palette.primary300}; break-after: avoid; page-break-after: avoid; }
    .mg-summary-atom .mg-section-head { margin-top: 0; }
    .mg-summary { font-size: 9.5pt; line-height: 1.65; color: #292524; text-align: justify; hyphens: auto; overflow-wrap: break-word; }
    .mg-summary-atom { margin-bottom: 5mm; }
    .mg-job { margin-bottom: 3.5mm; page-break-inside: avoid; break-inside: avoid; }
    .mg-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; flex-wrap: wrap; }
    .mg-jobtitle { font-size: 10pt; font-weight: 700; color: #1c1917; min-width: 0; flex: 1 1 auto; overflow-wrap: break-word; }
    .mg-jobmeta { font-size: 8.4pt; color: #78716c; font-style: italic; flex-shrink: 0; font-variant-numeric: tabular-nums; }
    .mg-jobco { font-size: 9pt; color: ${palette.primary700}; font-weight: 600; margin-bottom: 1.2mm; font-style: italic; overflow-wrap: break-word; }
    .mg-job ul { list-style: none; padding: 0; margin: 0; }
    .mg-job li { font-size: 9pt; line-height: 1.5; padding-left: 4.5mm; position: relative; margin-bottom: 0.8mm; color: #292524; overflow-wrap: break-word; }
    .mg-job li::before { content: "—"; position: absolute; left: 0; color: ${palette.primary700}; font-weight: 700; }
    .mg-edu { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2mm; gap: 4mm; flex-wrap: wrap; page-break-inside: avoid; break-inside: avoid; }
    .mg-edu > div:first-child { min-width: 0; flex: 1 1 auto; }
    .mg-edutitle { font-size: 9.6pt; font-weight: 700; color: #1c1917; overflow-wrap: break-word; }
    .mg-eduschool { font-size: 8.8pt; color: ${palette.primary700}; font-style: italic; overflow-wrap: break-word; }
    .mg-edumeta { font-size: 8.4pt; color: #78716c; font-style: italic; font-variant-numeric: tabular-nums; text-align: right; flex-shrink: 0; }
    .mg-proj { margin-bottom: 3mm; padding-bottom: 2.5mm; border-bottom: 1px dashed ${palette.primary200}; page-break-inside: avoid; break-inside: avoid; }
    .mg-proj:last-child { border-bottom: 0; padding-bottom: 0; margin-bottom: 0; }
    .mg-projname { font-family: 'Instrument Serif', 'Iowan Old Style', Georgia, serif; font-size: 11pt; font-weight: 400; color: #1c1917; margin-bottom: 0.6mm; overflow-wrap: break-word; }
    .mg-projrole { font-size: 8.4pt; color: #78716c; font-style: italic; margin-bottom: 1mm; overflow-wrap: break-word; }
    .mg-projdesc { font-size: 9pt; color: #292524; line-height: 1.5; margin-bottom: 1mm; overflow-wrap: break-word; }
    .mg-projstack { font-size: 8.4pt; color: ${palette.primary700}; font-weight: 600; overflow-wrap: anywhere; }
    .mg-cert { font-size: 8.3pt; margin-bottom: 1.6mm; line-height: 1.4; overflow-wrap: break-word; }
    .mg-cert:last-child { margin-bottom: 0; }
    .mg-cert strong { color: #1c1917; display: block; font-weight: 700; overflow-wrap: break-word; }
    .mg-cert .meta { color: #78716c; font-style: italic; font-size: 7.8pt; overflow-wrap: break-word; }
    .mg-award { font-size: 8.3pt; margin-bottom: 1.6mm; line-height: 1.4; overflow-wrap: break-word; }
    .mg-award:last-child { margin-bottom: 0; }
    .mg-award strong { color: #1c1917; display: block; font-weight: 700; overflow-wrap: break-word; }
    .mg-lang { display: flex; justify-content: space-between; gap: 2mm; font-size: 8.4pt; margin-bottom: 1mm; flex-wrap: wrap; }
    .mg-lang:last-child { margin-bottom: 0; }
    .mg-lang > span:first-child { min-width: 0; overflow-wrap: break-word; }
    .mg-lang .lvl { color: ${palette.primary700}; font-size: 8pt; font-style: italic; flex-shrink: 0; }
    .mg-chips { display: flex; flex-wrap: wrap; gap: 1.2mm; }
    .mg-chip { background: #ffffff; border: 1px solid ${palette.primary300}; color: #1c1917; padding: 0.3mm 1.6mm; border-radius: 2px; font-size: 7.8pt; font-weight: 500; max-width: 100%; overflow-wrap: break-word; word-break: break-word; }
    .mg-extra { font-size: 8.3pt; margin-bottom: 1.5mm; line-height: 1.45; overflow-wrap: break-word; }
    .mg-extra:last-child { margin-bottom: 0; }
    .mg-extra strong { color: #1c1917; display: block; font-weight: 700; font-size: 7.8pt; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 0.4mm; overflow-wrap: break-word; }
    .mg-stats p { line-height: 1.75; font-size: 8.3pt; margin: 0; overflow-wrap: break-word; }
    .mg-stats strong { color: #1c1917; font-family: 'Instrument Serif', 'Iowan Old Style', Georgia, serif; font-size: 11pt; font-weight: 400; }
  `;

  // ───── Sidebar atoms ─────
  const sidebarAtoms: React.ReactNode[] = [];

  sidebarAtoms.push(
    <div className="mg-sb-atom" key="identity">
      {resume.profile.photoUrl ? (
        <img
          className="mg-photo"
          src={resume.profile.photoUrl}
          alt={resume.profile.name}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      ) : logo ? (
        <div className="mg-logo">
          <logo.Icon style={{ width: "9mm", height: "9mm" }} />
        </div>
      ) : null}
      <div className="mg-name">{resume.profile.name}</div>
      {resume.profile.title && <div className="mg-role">{resume.profile.title}</div>}
      <div className="mg-orn" />
    </div>,
  );

  if (resume.contact.length > 0) {
    sidebarAtoms.push(
      <div className="mg-sb-atom" key="contact">
        <div className="mg-h3">Contact</div>
        {resume.contact.map((c) => (
          <div key={c.id} className="mg-contact">
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
        <div className="mg-sb-atom" key={`skill-${group.id}`}>
          {idx === 0 && <div className="mg-h3">Expertise</div>}
          <div className="mg-skill-group">
            <div className="mg-skill-label">
              {GroupIcon && <GroupIcon className="mg-skill-icon" />}
              <span>{group.label}</span>
            </div>
            <div className="mg-skill-list">{splitSkills(group.items).join(", ")}</div>
          </div>
        </div>,
      );
    });
  }

  if (resume.certifications.length > 0) {
    sidebarAtoms.push(
      <div className="mg-sb-atom" key="certs">
        <div className="mg-h3">Certifications</div>
        {resume.certifications.map((c) => (
          <div className="mg-cert" key={c.id}>
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
      <div className="mg-sb-atom" key="awards">
        <div className="mg-h3">Honours</div>
        {resume.awards.map((a) => (
          <div className="mg-award" key={a.id}>
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
      <div className="mg-sb-atom" key="langs">
        <div className="mg-h3">Languages</div>
        {resume.languages.map((l) => (
          <div className="mg-lang" key={l.id}>
            <span>{l.name}</span>
            {l.level && <span className="lvl">{l.level}</span>}
          </div>
        ))}
      </div>,
    );
  }

  if (resume.tools.length > 0) {
    sidebarAtoms.push(
      <div className="mg-sb-atom" key="tools">
        <div className="mg-h3">{resume.toolsLabel?.trim() || "Tools"}</div>
        <div className="mg-chips">
          {resume.tools.map((t, i) => (
            // oxlint-disable-next-line jsx/no-array-index-key
            <span className="mg-chip" key={i}>
              {t}
            </span>
          ))}
        </div>
      </div>,
    );
  }

  if (resume.interests.length > 0) {
    sidebarAtoms.push(
      <div className="mg-sb-atom" key="interests">
        <div className="mg-h3">{resume.interestsLabel?.trim() || "Interests"}</div>
        <div className="mg-chips">
          {resume.interests.map((t, i) => (
            // oxlint-disable-next-line jsx/no-array-index-key
            <span className="mg-chip" key={i}>
              {t}
            </span>
          ))}
        </div>
      </div>,
    );
  }

  if (resume.quickStats.length > 0) {
    sidebarAtoms.push(
      <div className="mg-sb-atom" key="stats">
        <div className="mg-h3">At a Glance</div>
        <div className="mg-stats">
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

  resume.extras.forEach((x, idx) => {
    sidebarAtoms.push(
      <div className="mg-sb-atom" key={`extra-${x.id}`}>
        {idx === 0 && <div className="mg-h3">Extras</div>}
        <div className="mg-extra">
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
      <div className="mg-summary-atom" key="summary">
        <h2 className="mg-section-head">Profile</h2>
        <p className="mg-summary">
          <RichText value={resume.profile.summary} />
        </p>
      </div>,
    );
  }

  if (resume.experience.length > 0) {
    mainAtoms.push(
      <h2 className="mg-section-head" data-keep-with-next="true" key="exp-h">
        Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      mainAtoms.push(
        <div className="mg-job" key={`exp-${job.id}`}>
          <div className="mg-jobhead">
            <div className="mg-jobtitle">{job.title}</div>
            <div className="mg-jobmeta">
              {formatDateRange(job.start, job.end)}
              {formatLocation(job.location, " · ")}
            </div>
          </div>
          <div className="mg-jobco">{job.company}</div>
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
      <h2 className="mg-section-head" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      mainAtoms.push(
        <div className="mg-edu" key={`edu-${ed.id}`}>
          <div>
            <div className="mg-edutitle">{ed.degree}</div>
            <div className="mg-eduschool">
              {ed.school}
              {formatLocation(ed.location)}
            </div>
          </div>
          <div className="mg-edumeta">
            {formatDateRange(ed.start, ed.end)}
            {ed.detail ? ` · ${ed.detail}` : ""}
          </div>
        </div>,
      );
    });
  }

  if (resume.projects.length > 0) {
    mainAtoms.push(
      <h2 className="mg-section-head" data-keep-with-next="true" key="proj-h">
        Selected Work
      </h2>,
    );
    resume.projects.forEach((p) => {
      mainAtoms.push(
        <div className="mg-proj" key={`proj-${p.id}`}>
          <div className="mg-projname">{p.name}</div>
          {p.role && <div className="mg-projrole">{p.role}</div>}
          {p.description && (
            <div className="mg-projdesc">
              <RichText value={p.description} />
            </div>
          )}
          {p.stack.length > 0 && <div className="mg-projstack">{p.stack.join(" · ")}</div>}
        </div>,
      );
    });
  }

  resume.custom
    .filter((c) => c.header.trim() && c.bullets.some((b) => b.trim()))
    .forEach((c) => {
      mainAtoms.push(
        <h2 className="mg-section-head" data-keep-with-next="true" key={`custom-h-${c.id}`}>
          {c.header}
        </h2>,
      );
      if (c.bullets.length === 1) {
        mainAtoms.push(
          <p className="mg-summary" key={`custom-p-${c.id}`}>
            <RichText value={c.bullets[0]} />
          </p>,
        );
      } else {
        mainAtoms.push(
          <div className="mg-job" key={`custom-${c.id}`}>
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
          <div className="mg-cont-name">
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
        sidebarClassName="mg-sidebar"
        sidebarContentWidthMm={SIDEBAR_CONTENT_WIDTH_MM}
        sidebarWidthMm={SIDEBAR_WIDTH_MM}
        sidebarBackground={palette.primary50}
        sidebarPaddingMm={[SIDEBAR_PAD_V, SIDEBAR_PAD_H]}
        sidebarContinuationReserveMm={16}
        sidebarBottomBufferMm={6}
        mainPaddingMm={[14, 12]}
        pageClassName="mg-root"
      >
        {mainAtoms}
      </PaginatedCanvas>
    </>
  );
}
