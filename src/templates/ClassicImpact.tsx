/**
 * Classic Impact preserves the familiar tinted identity sidebar and places
 * measurable results directly beneath the professional summary in the main column.
 * Each stats row, supporting fact, project paragraph, and experience bullet is a
 * separate pagination atom so long documents keep a useful reading rhythm.
 * Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V4
 */

import { memo, type ReactNode } from "react";
import { PaginatedCanvas } from "../components/PaginatedCanvas.tsx";
import type { TemplateProps } from "./index.ts";
import { findLogoIcon } from "../utils/logoIcons.ts";
import { RichText } from "../utils/richText.tsx";
import { pushSplitItem } from "./paginationAtoms.tsx";
import {
  certificationLink,
  contactIcon,
  formatDateRange,
  formatLocation,
  renderContactValue,
  splitSkills,
} from "./shared.tsx";

const SIDEBAR_WIDTH_MM = 64;
const SIDEBAR_PADDING_MM = 7;

export const ClassicImpact = memo(function ClassicImpact({ resume, palette }: TemplateProps) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const statColumns = Math.max(1, Math.min(resume.quickStats.length, 4));
  const css = `
    .ci-root { font-family: var(--ci-font); color: var(--ci-ink); font-size: 9pt; line-height: 1.45; overflow-wrap: break-word; word-break: normal; hyphens: manual; --ci-font: 'Geist Variable', 'Inter', sans-serif; --ci-ink: #1f2937; --ci-heading: #111827; --ci-muted: #4b5563; --ci-rule: #d1d5db; --ci-accent: ${palette.primary700}; --ci-tint: ${palette.primary50}; --ci-accent-rule: ${palette.primary200}; --ci-on-accent: ${palette.primaryText};  }
    .ci-sidebar { min-width: 0; }
    .ci-identity { margin-bottom: 6mm; }
    .ci-photo { width: 27mm; height: 27mm; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto 4mm; border: 1px solid var(--ci-accent-rule); }
    .ci-logo { width: 14mm; height: 14mm; border-radius: 3mm; background: var(--ci-accent); color: var(--ci-on-accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 3mm; }
    .ci-name { margin: 0; font-size: 19pt; font-weight: 750; color: var(--ci-heading); line-height: 1.15; text-align: center; }
    .ci-role { font-size: 9pt; color: var(--ci-accent); font-weight: 600; margin-top: 3mm; text-align: center; }
    .ci-divider { height: 2px; background: var(--ci-accent); width: 18mm; margin: 5mm auto 0; }
    .ci-cont-name { font-size: 10pt; font-weight: 700; color: var(--ci-heading); padding-bottom: 2mm; border-bottom: 1px solid var(--ci-accent-rule); margin-bottom: 4mm; }
    .ci-cont-name small { display: block; font-size: 8pt; color: var(--ci-muted); font-weight: 500; margin-top: 1mm; }
    .ci-side-head { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.9px; color: var(--ci-accent); margin: 4mm 0 2mm; font-weight: 700; border-bottom: 1px solid var(--ci-accent-rule); padding-bottom: 1.4mm; }
    .ci-sb-item { margin-bottom: 2.3mm; min-width: 0; }
    .ci-contact { display: flex; align-items: flex-start; gap: 1.6mm; font-size: 8.5pt; overflow-wrap: anywhere; word-break: break-word; }
    .ci-contact-icon { color: var(--ci-accent); display: inline-flex; flex-shrink: 0; margin-top: 0.8mm; }
    .ci-contact-value { min-width: 0; }
    .ci-skill-label { font-size: 9pt; font-weight: 650; color: var(--ci-heading); margin-bottom: 0.6mm; display: flex; align-items: center; gap: 1.5mm; }
    .ci-skill-label > :not(svg) { min-width: 0; overflow-wrap: anywhere; }
    .ci-skill-icon { width: 1em; height: 1em; color: var(--ci-accent); flex-shrink: 0; }
    .ci-skill-list { font-size: 9pt; overflow-wrap: anywhere; word-break: break-word; }
    .ci-side-strong { color: var(--ci-heading); display: block; font-weight: 650; }
    .ci-side-meta { color: var(--ci-muted); }
    .ci-section-head { font-size: 10.5pt; color: var(--ci-heading); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin: 5mm 0 2.5mm; padding-bottom: 1.2mm; border-bottom: 1.5px solid var(--ci-heading); position: relative; break-after: avoid; page-break-after: avoid; }
    .ci-section-head::after { content: ""; position: absolute; left: 0; bottom: -1.5px; width: 12mm; height: 1.5px; background: var(--ci-accent); }
    .ci-summary-head { margin-top: 0; }
    .ci-summary { font-size: 9.2pt; line-height: 1.55; margin: 0 0 2mm; }
    .ci-stats-row { display: grid; grid-template-columns: repeat(${statColumns}, minmax(0, 1fr)); gap: 2mm; margin-bottom: 2mm; break-inside: avoid; page-break-inside: avoid; }
    .ci-stat { background: var(--ci-tint); border-top: 2px solid var(--ci-accent); padding: 2.4mm 2mm; min-width: 0; }
    .ci-stat-value { overflow-wrap: anywhere; word-break: break-word; display: block; font-size: 18pt; font-weight: 750; line-height: 1.2; color: var(--ci-accent); font-variant-numeric: tabular-nums; }
    .ci-stat-label { display: block; font-size: 8.5pt; line-height: 1.4; color: var(--ci-ink); margin-top: 1.4mm; }
    .ci-job { margin-bottom: 3mm; }
    .ci-job-head { margin-bottom: 0; }
    .ci-jobhead { display: flex; justify-content: space-between; align-items: baseline; gap: 1mm 3mm; flex-wrap: wrap; }
    .ci-jobtitle { font-size: 10pt; font-weight: 700; color: var(--ci-heading); min-width: 0; }
    .ci-jobmeta { font-size: 8.5pt; color: var(--ci-muted); font-variant-numeric: tabular-nums; }
    .ci-jobco { font-size: 9pt; color: var(--ci-accent); font-weight: 600; margin: 0.8mm 0 1.2mm; }
    .ci-ul-bullet { margin: 0; padding-left: 4mm; list-style: disc; }
    .ci-ul-bullet li { font-size: 9pt; line-height: 1.45; padding-left: 0.3mm; margin-bottom: 0.8mm; }
    .ci-ul-bullet li::marker { color: var(--ci-accent); }
    .ci-ul-bullet-first { margin-top: 0; }
    .ci-ul-bullet-last { margin-bottom: 3mm; }
    .ci-edu { margin-bottom: 3mm; }
    .ci-project-part { margin: 0 0 1.5mm; font-size: 9pt; line-height: 1.45; }
    .ci-project-label { font-size: 8pt; color: var(--ci-muted); font-weight: 650; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 1.5mm; }
    .ci-stack { font-size: 8.5pt; color: var(--ci-accent); margin: 1mm 0 3mm; overflow-wrap: anywhere; word-break: break-word; }
    .ci-chips { display: flex; flex-wrap: wrap; gap: 1.5mm; }
    .ci-chip { border: 1px solid var(--ci-accent-rule); padding: 0.5mm 1.5mm; font-size: 8.5pt; max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
  `;

  const sidebarAtoms: ReactNode[] = [
    <div className="ci-identity" key="identity">
      {resume.profile.photoUrl ? (
        <img
          className="ci-photo"
          src={resume.profile.photoUrl}
          alt={resume.profile.name}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      ) : logo ? (
        <div className="ci-logo">
          <logo.Icon style={{ width: "8mm", height: "8mm" }} />
        </div>
      ) : null}
      <h1 className="ci-name">{resume.profile.name}</h1>
      {resume.profile.title && (
        <div className="ci-role resume-profile-title">{resume.profile.title}</div>
      )}
      <div className="ci-divider" />
    </div>,
  ];

  resume.contact.forEach((contact, i) => {
    sidebarAtoms.push(
      <div className="ci-sb-item" key={`contact-${contact.id}`}>
        {i === 0 && <h2 className="ci-side-head">Contact</h2>}
        <div className="ci-contact">
          <span className="ci-contact-icon">{contactIcon(contact.kind, 10)}</span>
          <span className="ci-contact-value">{renderContactValue(contact)}</span>
        </div>
      </div>,
    );
  });

  resume.skills.forEach((group, i) => {
    const GroupIcon = findLogoIcon(group.iconName)?.Icon;
    sidebarAtoms.push(
      <div className="ci-sb-item" key={`skill-${group.id}`}>
        {i === 0 && <h2 className="ci-side-head">Core Expertise</h2>}
        <div className="ci-skill-label">
          {GroupIcon && <GroupIcon className="ci-skill-icon" />}
          <span>{group.label}</span>
        </div>
        <div className="ci-skill-list">{splitSkills(group.items).join(", ")}</div>
      </div>,
    );
  });

  resume.certifications.forEach((cert, i) => {
    sidebarAtoms.push(
      <div className="ci-sb-item" key={`cert-${cert.id}`} data-keep-together="true">
        {i === 0 && <h2 className="ci-side-head">Certifications</h2>}
        {certificationLink(cert, <strong className="ci-side-strong">{cert.name}</strong>)}
        <div className="ci-side-meta">{[cert.issuer, cert.year].filter(Boolean).join(" · ")}</div>
      </div>,
    );
  });

  resume.awards.forEach((award, i) => {
    sidebarAtoms.push(
      <div className="ci-sb-item" key={`award-${award.id}`}>
        {i === 0 && <h2 className="ci-side-head">Awards</h2>}
        <strong className="ci-side-strong">
          {award.title}
          {award.year ? ` · ${award.year}` : ""}
        </strong>
        {award.detail}
      </div>,
    );
  });

  resume.languages.forEach((language, i) => {
    sidebarAtoms.push(
      <div className="ci-sb-item" key={`language-${language.id}`}>
        {i === 0 && <h2 className="ci-side-head">Languages</h2>}
        <strong className="ci-side-strong">{language.name}</strong>
        <span className="ci-side-meta">{language.level}</span>
      </div>,
    );
  });

  for (const [kind, items, label] of [
    ["tools", resume.tools, resume.toolsLabel?.trim() || "Tools I Use"],
    ["interests", resume.interests, resume.interestsLabel?.trim() || "Interests"],
  ] as const) {
    for (let i = 0; i < items.length; i += 3) {
      sidebarAtoms.push(
        <div className="ci-sb-item" key={`${kind}-${i}`}>
          {i === 0 && <h2 className="ci-side-head">{label}</h2>}
          <div className="ci-chips">
            {items.slice(i, i + 3).map((item, offset) => (
              // oxlint-disable-next-line jsx/no-array-index-key
              <span className="ci-chip" key={`${i}-${offset}`} data-keep-together="true">
                {item}
              </span>
            ))}
          </div>
        </div>,
      );
    }
  }

  resume.extras.forEach((extra, i) => {
    sidebarAtoms.push(
      <div className="ci-sb-item" key={`extra-${extra.id}`}>
        {i === 0 && <h2 className="ci-side-head">Extras</h2>}
        <strong className="ci-side-strong">{extra.label}</strong>
        {extra.value}
      </div>,
    );
  });

  const mainAtoms: ReactNode[] = [];

  if (resume.profile.summary) {
    mainAtoms.push(
      <h2 className="ci-section-head ci-summary-head" data-keep-with-next="true" key="summary-h">
        Professional Summary
      </h2>,
      <p className="ci-summary" key="summary">
        <RichText value={resume.profile.summary} />
      </p>,
    );
  }

  if (resume.quickStats.length > 0) {
    mainAtoms.push(
      <h2 className="ci-section-head" data-keep-with-next="true" key="stats-h">
        Quick Stats
      </h2>,
    );
    for (let i = 0; i < resume.quickStats.length; i += 4) {
      mainAtoms.push(
        <div className="ci-stats-row" data-stat-row="true" key={`stats-${i}`}>
          {resume.quickStats.slice(i, i + 4).map((stat) => (
            <div className="ci-stat" key={stat.id} data-stat-card="true">
              <strong className="ci-stat-value">{stat.value}</strong>
              <span className="ci-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>,
      );
    }
  }

  if (resume.experience.length > 0) {
    mainAtoms.push(
      <h2 className="ci-section-head" data-keep-with-next="true" key="exp-h">
        Work Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      const head = (
        <div
          className={`ci-job${job.bullets.length > 0 ? " ci-job-head" : ""}`}
          key={`exp-${job.id}`}
        >
          <div className="ci-jobhead">
            <div className="ci-jobtitle">{job.title}</div>
            <div className="ci-jobmeta">
              {formatDateRange(job.start, job.end)}
              {formatLocation(job.location, " · ")}
            </div>
          </div>
          <div className="ci-jobco">{job.company}</div>
        </div>
      );
      if (job.bullets.length === 0) {
        mainAtoms.push(head);
        return;
      }
      pushSplitItem(mainAtoms, {
        keyPrefix: `exp-${job.id}`,
        renderHead: () => head,
        bullets: job.bullets,
        renderBullet: (bullet, i, total) => (
          <ul
            className={`ci-ul-bullet${i === 0 ? " ci-ul-bullet-first" : ""}${i === total - 1 ? " ci-ul-bullet-last" : ""}`}
          >
            <li>
              <RichText value={bullet} />
            </li>
          </ul>
        ),
      });
    });
  }

  if (resume.education.length > 0) {
    mainAtoms.push(
      <h2 className="ci-section-head" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((education) => {
      mainAtoms.push(
        <div className="ci-edu" key={`edu-${education.id}`}>
          <div className="ci-jobhead">
            <div className="ci-jobtitle">{education.degree}</div>
            <div className="ci-jobmeta">{formatDateRange(education.start, education.end)}</div>
          </div>
          <div className="ci-jobco">
            {education.school}
            {formatLocation(education.location)}
          </div>
          {education.detail}
        </div>,
      );
    });
  }

  if (resume.projects.length > 0) {
    mainAtoms.push(
      <h2 className="ci-section-head" data-keep-with-next="true" key="proj-h">
        Key Projects
      </h2>,
    );
    resume.projects.forEach((project) => {
      const projectBullets = [project.description, ...(project.roles ?? [])].filter(Boolean);
      const head = (
        <div className="ci-jobtitle" key={`proj-${project.id}`}>
          {project.name}
        </div>
      );
      if (projectBullets.length > 0) {
        pushSplitItem(mainAtoms, {
          keyPrefix: `proj-${project.id}`,
          renderHead: () => head,
          bullets: projectBullets,
          renderBullet: (bullet, i) => (
            <p className="ci-project-part">
              <span className="ci-project-label">
                {i === 0 && project.description ? "About Project" : "Role"}
              </span>
              <RichText value={bullet} />
            </p>
          ),
        });
      } else {
        mainAtoms.push(head);
      }
      if (project.stack.length > 0) {
        mainAtoms.push(
          <p className="ci-stack" key={`stack-${project.id}`}>
            {project.stack.join(" · ")}
          </p>,
        );
      }
    });
  }

  resume.custom
    .filter((section) => section.header.trim() && section.bullets.some((bullet) => bullet.trim()))
    .forEach((section) => {
      mainAtoms.push(
        <h2 className="ci-section-head" data-keep-with-next="true" key={`custom-h-${section.id}`}>
          {section.header}
        </h2>,
      );
      const bullets = section.bullets.filter((bullet) => bullet.trim());
      if (bullets.length === 1) {
        mainAtoms.push(
          <p className="ci-summary" key={`custom-${section.id}`}>
            <RichText value={bullets[0]} />
          </p>,
        );
      } else {
        pushSplitItem(mainAtoms, {
          keyPrefix: `custom-${section.id}`,
          bullets,
          renderBullet: (bullet, i, total) => (
            <ul
              className={`ci-ul-bullet${i === 0 ? " ci-ul-bullet-first" : ""}${i === total - 1 ? " ci-ul-bullet-last" : ""}`}
            >
              <li>
                <RichText value={bullet} />
              </li>
            </ul>
          ),
        });
      }
    });

  return (
    <>
      <style>{css}</style>
      <PaginatedCanvas
        sidebar={(pageIndex, _pageCount, atomsForPage) =>
          atomsForPage.length > 0 ? (
            <>
              {pageIndex > 0 && (
                <div className="ci-cont-name">
                  {resume.profile.name}
                  <small>Continued</small>
                </div>
              )}
              {atomsForPage.map((atom, i) => (
                // oxlint-disable-next-line jsx/no-array-index-key
                <div key={i} style={{ display: "flow-root" }}>
                  {atom}
                </div>
              ))}
            </>
          ) : null
        }
        sidebarAtoms={sidebarAtoms}
        sidebarClassName="ci-sidebar"
        sidebarWidthMm={SIDEBAR_WIDTH_MM}
        sidebarContentWidthMm={SIDEBAR_WIDTH_MM - 2 * SIDEBAR_PADDING_MM}
        sidebarBackground={palette.primary50}
        sidebarPaddingMm={[12, SIDEBAR_PADDING_MM]}
        sidebarContinuationReserveMm={12}
        sidebarBottomBufferMm={4}
        mainPaddingMm={[10, 10]}
        pageClassName="ci-root"
      >
        {mainAtoms}
      </PaginatedCanvas>
    </>
  );
});
