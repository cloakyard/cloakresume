/**
 * Academic template.
 *
 * Traditional scholarly CV style: serif headings, centered title block,
 * ruled section dividers, and a left-aligned publication-style layout.
 * Designed for researchers, professors, and fellowship applications
 * where the convention is dense, restrained, and print-optimised.
 *
 * Uses the shared `PaginatedCanvas` so long CVs flow cleanly across
 * multiple A4 pages at section boundaries.
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

export function Academic({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const css = `
    .ac-root { font-family: 'Lora', 'Times New Roman', serif; color: #1a1a1a; font-size: 10pt; line-height: 1.5; }
    .ac-head { text-align: center; padding-bottom: 4mm; border-bottom: 2px solid #1a1a1a; margin-bottom: 6mm; position: relative; }
    .ac-head::after { content: ""; position: absolute; bottom: -4px; left: 0; right: 0; border-bottom: 1px solid #1a1a1a; }
    .ac-logo-wrap { display: flex; justify-content: center; margin-bottom: 2mm; }
    .ac-logo { width: 13mm; height: 13mm; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1.5px solid ${palette.primary600}; color: ${palette.primary600}; overflow: hidden; }
    .ac-photo { width: 13mm; height: 13mm; border-radius: 50%; object-fit: cover; border: 1.5px solid ${palette.primary600}; }
    .ac-name { font-size: 22pt; font-weight: 700; letter-spacing: 1.5px; color: #0f172a; margin: 0; font-variant: small-caps; }
    .ac-title { font-size: 11pt; color: #374151; margin-top: 1.5mm; font-style: italic; }
    .ac-contact { margin-top: 3mm; font-size: 9pt; color: #374151; display: flex; justify-content: center; flex-wrap: wrap; gap: 2mm 5mm; }
    .ac-contact span { display: inline-flex; align-items: center; gap: 1mm; }
    .ac-contact svg { color: ${palette.primary700}; }
    .ac-h2 { font-size: 11.2pt; text-transform: uppercase; letter-spacing: 2px; color: #0f172a; font-weight: 700; margin: 5mm 0 2mm; padding-bottom: 1mm; border-bottom: 1px solid #94a3b8; display: flex; align-items: baseline; gap: 3mm; break-after: avoid; page-break-after: avoid; }
    .ac-h2::after { content: ""; flex: 1; border-bottom: 1px dotted #cbd5e1; }
    .ac-summary { font-size: 10pt; line-height: 1.6; text-align: justify; color: #1a1a1a; }
    .ac-entry { display: grid; grid-template-columns: 1fr auto; gap: 4mm; margin-bottom: 2.5mm; align-items: baseline; page-break-inside: avoid; break-inside: avoid; }
    .ac-entry-title { font-weight: 700; color: #0f172a; }
    .ac-entry-sub { font-style: italic; color: ${palette.primary700}; font-size: 9.2pt; }
    .ac-entry-date { font-size: 9pt; color: #4b5563; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .ac-body { font-size: 9.6pt; color: #1a1a1a; margin-top: 0.8mm; line-height: 1.55; }
    .ac-body ul { list-style: disc; padding-left: 5mm; margin: 1mm 0 0; }
    .ac-body li { margin-bottom: 0.8mm; }
    .ac-skill-row { display: grid; grid-template-columns: 40mm 1fr; gap: 5mm; margin-bottom: 1.2mm; font-size: 9.8pt; page-break-inside: avoid; break-inside: avoid; }
    .ac-skill-label { font-weight: 700; color: #0f172a; font-variant: small-caps; letter-spacing: 0.5px; display: flex; align-items: center; gap: 1.8mm; }
    .ac-skill-icon { width: 1em; height: 1em; color: ${palette.primary700}; flex-shrink: 0; }
    .ac-two { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
    .ac-kv { font-size: 9.4pt; margin-bottom: 1.4mm; }
    .ac-kv strong { color: #0f172a; }
    .ac-proj-entry { margin-bottom: 2mm; page-break-inside: avoid; break-inside: avoid; }
  `;

  const atoms: React.ReactNode[] = [];

  atoms.push(
    <header className="ac-head" key="head">
      {(logo || resume.profile.photoUrl) && (
        <div className="ac-logo-wrap">
          <div className="ac-logo">
            {resume.profile.photoUrl ? (
              <img src={resume.profile.photoUrl} alt="" className="ac-photo" />
            ) : logo ? (
              <logo.Icon style={{ width: "7mm", height: "7mm" }} />
            ) : null}
          </div>
        </div>
      )}
      <h1 className="ac-name">{resume.profile.name}</h1>
      <div className="ac-title">{resume.profile.title}</div>
      <div className="ac-contact">
        {resume.contact.map((c) => (
          <span key={c.id}>
            {contactIcon(c.kind, 10)}
            {c.value}
          </span>
        ))}
      </div>
    </header>,
  );

  if (resume.profile.summary) {
    atoms.push(
      <h2 className="ac-h2" data-keep-with-next="true" key="summary-h">
        Research Statement
      </h2>,
      <p className="ac-summary" key="summary-p">
        <RichText value={resume.profile.summary} />
      </p>,
    );
  }

  if (resume.education.length > 0) {
    atoms.push(
      <h2 className="ac-h2" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      atoms.push(
        <div className="ac-entry" key={`edu-${ed.id}`}>
          <div>
            <div className="ac-entry-title">{ed.degree}</div>
            <div className="ac-entry-sub">
              {ed.school}
              {ed.location ? `, ${ed.location}` : ""}
            </div>
            {ed.detail && <div className="ac-body">{ed.detail}</div>}
          </div>
          <div className="ac-entry-date">
            {ed.start}
            {ed.end ? ` – ${ed.end}` : ""}
          </div>
        </div>,
      );
    });
  }

  if (resume.experience.length > 0) {
    atoms.push(
      <h2 className="ac-h2" data-keep-with-next="true" key="exp-h">
        Appointments
      </h2>,
    );
    resume.experience.forEach((job) => {
      atoms.push(
        <div className="ac-entry" key={`exp-${job.id}`} style={{ marginBottom: "3mm" }}>
          <div>
            <div className="ac-entry-title">{job.title}</div>
            <div className="ac-entry-sub">
              {job.company}
              {job.location ? `, ${job.location}` : ""}
            </div>
            <div className="ac-body">
              <ul>
                {job.bullets.map((b, i) => (
                  // oxlint-disable-next-line jsx/no-array-index-key
                  <li key={`${job.id}-b-${i}`}>
                    <RichText value={b} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="ac-entry-date">
            {job.start}
            {job.end ? ` – ${job.end}` : ""}
          </div>
        </div>,
      );
    });
  }

  if (resume.projects.length > 0) {
    atoms.push(
      <h2 className="ac-h2" data-keep-with-next="true" key="proj-h">
        Selected Work
      </h2>,
    );
    resume.projects.forEach((p) => {
      atoms.push(
        <div className="ac-proj-entry" key={`proj-${p.id}`}>
          <div className="ac-entry-title">{p.name}</div>
          <div className="ac-body">
            <RichText value={p.description} />
            {p.role ? ` ${p.role}` : ""}
            {p.stack.length > 0 && (
              <div
                style={{ marginTop: "0.8mm", fontStyle: "italic", color: palette.primary700 }}
              >
                {p.stack.join(" · ")}
              </div>
            )}
          </div>
        </div>,
      );
    });
  }

  if (resume.skills.length > 0) {
    atoms.push(
      <h2 className="ac-h2" data-keep-with-next="true" key="skills-h">
        Research Areas
      </h2>,
    );
    resume.skills.forEach((g) => {
      const GroupIcon = findLogoIcon(g.iconName)?.Icon;
      atoms.push(
        <div key={`skills-${g.id}`} className="ac-skill-row">
          <div className="ac-skill-label">
            {GroupIcon && <GroupIcon className="ac-skill-icon" />}
            <span>{g.label}</span>
          </div>
          <div>{splitSkills(g.items).join(", ")}</div>
        </div>,
      );
    });
  }

  // Honours & Certifications: 2-col grid — single atom keeps the layout.
  if (resume.certifications.length > 0 || resume.awards.length > 0) {
    atoms.push(
      <div key="honours">
        <h2 className="ac-h2">Honours &amp; Certifications</h2>
        <div className="ac-two">
          {resume.awards.length > 0 && (
            <div>
              {resume.awards.map((a) => (
                <div className="ac-kv" key={a.id}>
                  <strong>
                    {a.title}
                    {a.year ? ` (${a.year})` : ""}
                  </strong>{" "}
                  {a.detail}
                </div>
              ))}
            </div>
          )}
          {resume.certifications.length > 0 && (
            <div>
              {resume.certifications.map((c) => (
                <div className="ac-kv" key={c.id}>
                  <strong>{c.name}</strong>
                  {c.year ? ` (${c.year})` : ""} — {c.issuer}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>,
    );
  }

  // Additional Information: kept as single atom (compact mixed block).
  if (
    resume.languages.length > 0 ||
    resume.tools.length > 0 ||
    resume.interests.length > 0 ||
    resume.extras.length > 0
  ) {
    atoms.push(
      <div key="add">
        <h2 className="ac-h2">Additional Information</h2>
        {resume.languages.length > 0 && (
          <div className="ac-kv">
            <strong>Languages:</strong>{" "}
            {resume.languages.map((l) => `${l.name} (${l.level})`).join(", ")}
          </div>
        )}
        {resume.tools.length > 0 && (
          <div className="ac-kv">
            <strong>{resume.toolsLabel?.trim() || "Tools"}:</strong> {resume.tools.join(", ")}
          </div>
        )}
        {resume.interests.length > 0 && (
          <div className="ac-kv">
            <strong>{resume.interestsLabel?.trim() || "Interests"}:</strong>{" "}
            {resume.interests.join(", ")}
          </div>
        )}
        {resume.extras.map((x) => (
          <div className="ac-kv" key={x.id}>
            <strong>{x.label}:</strong> {x.value}
          </div>
        ))}
      </div>,
    );
  }

  return (
    <>
      <style>{css}</style>
      <PaginatedCanvas mainPaddingMm={[14, 18]} pageClassName="ac-root">
        {atoms}
      </PaginatedCanvas>
    </>
  );
}
