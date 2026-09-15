/**
 * Ledger is a professional brief: a left-aligned serif masthead, fine ruled
 * section bands, and a numeric results ledger immediately after the summary.
 * A single narrative column preserves reading order; supporting facts use
 * compact label/value rows instead of a persistent sidebar.
 * Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V5
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

export const Ledger = memo(function Ledger({ resume, palette }: TemplateProps) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const statColumns = Math.max(1, Math.min(resume.quickStats.length, 4));
  const css = `
    .ld-root { font-family: var(--ld-font); color: var(--ld-ink); font-size: 9.5pt; line-height: 1.5; overflow-wrap: break-word; word-break: normal; hyphens: manual; --ld-font: 'Geist Variable', 'Inter', sans-serif; --ld-display: 'Instrument Serif', 'Iowan Old Style', Georgia, serif; --ld-ink: #1f2937; --ld-heading: #17202d; --ld-muted: #4b5563; --ld-rule: #cbd5e1; --ld-accent: ${palette.primary700}; --ld-tint: ${palette.primary50}; --ld-accent-rule: ${palette.primary200};  }
    .ld-header { display: flex; align-items: center; justify-content: space-between; gap: 8mm; padding-bottom: 4mm; border-bottom: 2px solid var(--ld-heading); margin-bottom: 2mm; }
    .ld-identity { flex: 1; min-width: 0; }
    .ld-name { font-family: var(--ld-display); color: var(--ld-heading); font-size: 31pt; line-height: 1.1; font-weight: 400; margin: 0; letter-spacing: 0.2px; }
    .ld-title { font-size: 10pt; font-weight: 600; color: var(--ld-accent); margin: 2mm 0 0; }
    .ld-photo { width: 23mm; height: 27mm; object-fit: cover; flex-shrink: 0; border: 1px solid var(--ld-rule); }
    .ld-logo { color: var(--ld-accent); padding: 3mm; border: 1px solid var(--ld-accent-rule); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ld-contact-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1mm 6mm; margin-bottom: 1.2mm; }
    .ld-contact { display: flex; align-items: baseline; gap: 1.5mm; min-width: 0; font-size: 8.5pt; color: var(--ld-muted); overflow-wrap: anywhere; word-break: break-word; }
    .ld-contact svg { color: var(--ld-accent); flex-shrink: 0; align-self: flex-start; margin-top: 0.8mm; }
    .ld-h2 { margin: 5mm 0 3mm; padding: 1.8mm 2.5mm; border-top: 1px solid var(--ld-heading); border-bottom: 1px solid var(--ld-rule); background: var(--ld-tint); font-size: 9pt; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; color: var(--ld-heading); break-after: avoid; page-break-after: avoid; }
    .ld-summary { font-size: 9.5pt; line-height: 1.55; margin: 0 0 1mm; }
    .ld-stats-row { display: grid; grid-template-columns: repeat(${statColumns}, minmax(0, 1fr)); margin-bottom: 0; border-bottom: 1px solid var(--ld-rule); break-inside: avoid; page-break-inside: avoid; }
    .ld-stat { min-width: 0; padding: 3mm; border-left: 1px solid var(--ld-rule); }
    .ld-stat:first-child { border-left: 0; padding-left: 0; }
    .ld-stat-value { overflow-wrap: anywhere; word-break: break-word; display: block; font-size: 24pt; line-height: 1.1; letter-spacing: -0.5px; font-weight: 650; color: var(--ld-accent); font-variant-numeric: tabular-nums; }
    .ld-stat-label { display: block; font-size: 9pt; line-height: 1.4; color: var(--ld-muted); margin-top: 2mm; }
    .ld-entry { margin-bottom: 3.5mm; }
    .ld-job-head { margin-bottom: 0; }
    .ld-entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1mm 6mm; flex-wrap: wrap; }
    .ld-entry-title { font-size: 10.5pt; font-weight: 700; color: var(--ld-heading); min-width: 0; }
    .ld-entry-meta { font-size: 9pt; color: var(--ld-muted); font-variant-numeric: tabular-nums; }
    .ld-entry-sub { color: var(--ld-accent); font-weight: 600; font-size: 9.5pt; margin: 0.5mm 0 1.4mm; }
    .ld-ul-bullet { margin: 0; padding-left: 4.5mm; list-style: square; }
    .ld-ul-bullet li { font-size: 9.5pt; line-height: 1.5; padding-left: 0.5mm; margin-bottom: 1mm; }
    .ld-ul-bullet li::marker { color: var(--ld-accent); font-size: 0.75em; }
    .ld-ul-bullet-first { margin-top: 0; }
    .ld-ul-bullet-last { margin-bottom: 3.5mm; }
    .ld-fact { display: grid; grid-template-columns: 42mm minmax(0, 1fr); gap: 5mm; padding: 1.8mm 0; border-bottom: 1px solid var(--ld-rule); }
    .ld-fact-label { color: var(--ld-heading); font-weight: 650; min-width: 0; }
    .ld-fact-value { min-width: 0; }
    .ld-skill-label { display: flex; align-items: baseline; gap: 1.5mm; }
    .ld-skill-label > :not(svg) { min-width: 0; overflow-wrap: anywhere; }
    .ld-skill-icon { width: 1em; height: 1em; color: var(--ld-accent); flex-shrink: 0; }
    .ld-skill-list, .ld-stack { overflow-wrap: anywhere; word-break: break-word; }
    .ld-project-part { margin: 0 0 1.5mm; }
    .ld-project-label { font-size: 8pt; color: var(--ld-muted); font-weight: 650; text-transform: uppercase; letter-spacing: 0.7px; margin-right: 2mm; }
    .ld-stack { color: var(--ld-accent); font-size: 9pt; margin: 1mm 0 3.5mm; }
    .ld-item { margin-bottom: 2.2mm; }
    .ld-muted { color: var(--ld-muted); }
  `;

  const atoms: ReactNode[] = [
    <header className="ld-header" key="identity">
      <div className="ld-identity">
        <h1 className="ld-name">{resume.profile.name}</h1>
        {resume.profile.title && (
          <p className="ld-title resume-profile-title">{resume.profile.title}</p>
        )}
      </div>
      {resume.profile.photoUrl ? (
        <img
          className="ld-photo"
          src={resume.profile.photoUrl}
          alt={resume.profile.name}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      ) : logo ? (
        <div className="ld-logo">
          <logo.Icon style={{ width: "12mm", height: "12mm" }} />
        </div>
      ) : null}
    </header>,
  ];

  for (let i = 0; i < resume.contact.length; i += 2) {
    atoms.push(
      <div className="ld-contact-row" key={`contact-${i}`}>
        {resume.contact.slice(i, i + 2).map((contact) => (
          <div className="ld-contact" key={contact.id}>
            {contactIcon(contact.kind, 10)}
            {renderContactValue(contact)}
          </div>
        ))}
      </div>,
    );
  }

  const addHeading = (label: string, key: string) => {
    atoms.push(
      <h2 className="ld-h2" data-keep-with-next="true" key={key}>
        {label}
      </h2>,
    );
  };

  if (resume.profile.summary) {
    addHeading("Professional Summary", "summary-h");
    atoms.push(
      <p className="ld-summary" key="summary">
        <RichText value={resume.profile.summary} />
      </p>,
    );
  }

  if (resume.quickStats.length > 0) {
    addHeading("Quick Stats", "stats-h");
    for (let i = 0; i < resume.quickStats.length; i += 4) {
      atoms.push(
        <div className="ld-stats-row" data-stat-row="true" key={`stats-${i}`}>
          {resume.quickStats.slice(i, i + 4).map((stat) => (
            <div className="ld-stat" key={stat.id} data-stat-card="true">
              <strong className="ld-stat-value">{stat.value}</strong>
              <span className="ld-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>,
      );
    }
  }

  if (resume.experience.length > 0) {
    addHeading("Work Experience", "exp-h");
    resume.experience.forEach((job) => {
      const head = (
        <div
          className={`ld-entry${job.bullets.length > 0 ? " ld-job-head" : ""}`}
          key={`exp-${job.id}`}
        >
          <div className="ld-entry-head">
            <strong className="ld-entry-title">{job.title}</strong>
            <span className="ld-entry-meta">{formatDateRange(job.start, job.end)}</span>
          </div>
          <div className="ld-entry-sub">
            {job.company}
            {formatLocation(job.location, " · ")}
          </div>
        </div>
      );
      if (job.bullets.length === 0) {
        atoms.push(head);
        return;
      }
      pushSplitItem(atoms, {
        keyPrefix: `exp-${job.id}`,
        renderHead: () => head,
        bullets: job.bullets,
        renderBullet: (bullet, i, total) => (
          <ul
            className={`ld-ul-bullet${i === 0 ? " ld-ul-bullet-first" : ""}${i === total - 1 ? " ld-ul-bullet-last" : ""}`}
          >
            <li>
              <RichText value={bullet} />
            </li>
          </ul>
        ),
      });
    });
  }

  if (resume.projects.length > 0) {
    addHeading("Key Projects", "proj-h");
    resume.projects.forEach((project) => {
      const head = (
        <div className="ld-entry-title" key={`proj-${project.id}`}>
          {project.name}
        </div>
      );
      const bullets = [project.description, ...(project.roles ?? [])].filter(Boolean);
      if (bullets.length > 0) {
        pushSplitItem(atoms, {
          keyPrefix: `proj-${project.id}`,
          renderHead: () => head,
          bullets,
          renderBullet: (bullet, i) => (
            <p className="ld-project-part">
              <span className="ld-project-label">
                {i === 0 && project.description ? "About Project" : "Role"}
              </span>
              <RichText value={bullet} />
            </p>
          ),
        });
      } else {
        atoms.push(head);
      }
      if (project.stack.length > 0) {
        atoms.push(
          <p className="ld-stack" key={`stack-${project.id}`}>
            {project.stack.join(" · ")}
          </p>,
        );
      }
    });
  }

  if (resume.education.length > 0) {
    addHeading("Education", "edu-h");
    resume.education.forEach((education) => {
      atoms.push(
        <div className="ld-entry" key={`edu-${education.id}`}>
          <div className="ld-entry-head">
            <strong className="ld-entry-title">{education.degree}</strong>
            <span className="ld-entry-meta">{formatDateRange(education.start, education.end)}</span>
          </div>
          <div className="ld-entry-sub">
            {education.school}
            {formatLocation(education.location)}
          </div>
          {education.detail}
        </div>,
      );
    });
  }

  if (resume.skills.length > 0) {
    addHeading("Core Expertise", "skills-h");
    resume.skills.forEach((skill) => {
      const GroupIcon = findLogoIcon(skill.iconName)?.Icon;
      atoms.push(
        <div className="ld-fact" key={`skill-${skill.id}`}>
          <div className="ld-fact-label ld-skill-label">
            {GroupIcon && <GroupIcon className="ld-skill-icon" />}
            <span>{skill.label}</span>
          </div>
          <div className="ld-fact-value ld-skill-list">{splitSkills(skill.items).join(", ")}</div>
        </div>,
      );
    });
  }

  if (resume.certifications.length > 0) {
    addHeading("Certifications", "certs-h");
    resume.certifications.forEach((cert) => {
      atoms.push(
        <div className="ld-item" key={`cert-${cert.id}`}>
          <div className="ld-entry-head">
            {certificationLink(cert, <strong>{cert.name}</strong>)}
            {cert.year && <span className="ld-entry-meta">{cert.year}</span>}
          </div>
          {cert.issuer && <span className="ld-muted">{cert.issuer}</span>}
        </div>,
      );
    });
  }

  if (resume.awards.length > 0) {
    addHeading("Awards", "awards-h");
    resume.awards.forEach((award) => {
      atoms.push(
        <div className="ld-item" key={`award-${award.id}`}>
          <div className="ld-entry-head">
            <strong>{award.title}</strong>
            <span className="ld-entry-meta">{award.year}</span>
          </div>
          {award.detail}
        </div>,
      );
    });
  }

  if (resume.languages.length > 0) {
    addHeading("Languages", "languages-h");
    resume.languages.forEach((language) => {
      atoms.push(
        <div className="ld-fact" key={`language-${language.id}`}>
          <span className="ld-fact-label">{language.name}</span>
          <span className="ld-fact-value">{language.level}</span>
        </div>,
      );
    });
  }

  for (const [kind, items, label] of [
    ["tools", resume.tools, resume.toolsLabel?.trim() || "Tools I Use"],
    ["interests", resume.interests, resume.interestsLabel?.trim() || "Interests"],
  ] as const) {
    if (items.length === 0) continue;
    addHeading(label, `${kind}-h`);
    for (let i = 0; i < items.length; i += 5) {
      atoms.push(
        <p className="ld-stack" key={`${kind}-${i}`}>
          {items.slice(i, i + 5).join(" · ")}
        </p>,
      );
    }
  }

  if (resume.extras.length > 0) {
    addHeading("Extras", "extras-h");
    resume.extras.forEach((extra) => {
      atoms.push(
        <div className="ld-fact" key={`extra-${extra.id}`}>
          <strong className="ld-fact-label">{extra.label}</strong>
          <span className="ld-fact-value">{extra.value}</span>
        </div>,
      );
    });
  }

  resume.custom
    .filter((section) => section.header.trim() && section.bullets.some((bullet) => bullet.trim()))
    .forEach((section) => {
      addHeading(section.header, `custom-h-${section.id}`);
      const bullets = section.bullets.filter((bullet) => bullet.trim());
      if (bullets.length === 1) {
        atoms.push(
          <p className="ld-summary" key={`custom-${section.id}`}>
            <RichText value={bullets[0]} />
          </p>,
        );
      } else {
        pushSplitItem(atoms, {
          keyPrefix: `custom-${section.id}`,
          bullets,
          renderBullet: (bullet, i, total) => (
            <ul
              className={`ld-ul-bullet${i === 0 ? " ld-ul-bullet-first" : ""}${i === total - 1 ? " ld-ul-bullet-last" : ""}`}
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
      <PaginatedCanvas mainPaddingMm={[12, 14]} pageClassName="ld-root">
        {atoms}
      </PaginatedCanvas>
    </>
  );
});
