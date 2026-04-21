/**
 * Gradient Header template.
 *
 * Single-column layout with a bold coloured banner across the top that
 * carries the candidate identity + contact strip. The body below is
 * clean, print-friendly, and auto-flows across multiple A4 pages via
 * the shared `PaginatedCanvas` — so adding more content extends the
 * document rather than crowding one page. The gradient banner appears
 * on page 1 only; subsequent pages continue with a clean body column.
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

export function GradientHeader({ resume, palette }: Props) {
  const logo = findLogoIcon(resume.profile.logoIconName);
  const css = `
    .gh-root { font-family: 'Geist', 'Inter', sans-serif; color: #1f2937; font-size: 9.4pt; line-height: 1.5; }
    .gh-head { background: linear-gradient(135deg, ${palette.primary600} 0%, ${palette.primary900} 100%); color: ${palette.primaryText}; padding: 12mm 14mm; display: flex; align-items: center; gap: 8mm; margin: -8mm -14mm 6mm; }
    .gh-logo { width: 18mm; height: 18mm; border-radius: 4mm; background: rgba(255,255,255,0.18); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
    .gh-photo { width: 18mm; height: 18mm; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.6); }
    .gh-name { font-size: 20pt; font-weight: 700; letter-spacing: -0.3px; line-height: 1.05; margin: 0; }
    .gh-title { font-size: 10.2pt; margin-top: 1.2mm; letter-spacing: 1px; text-transform: uppercase; opacity: 0.92; font-weight: 600; }
    .gh-contact { display: flex; flex-wrap: wrap; gap: 1.5mm 4mm; margin-top: 3mm; font-size: 8.6pt; opacity: 0.95; }
    .gh-contact span { display: inline-flex; align-items: center; gap: 1.2mm; }
    .gh-h2 { font-size: 9.4pt; text-transform: uppercase; letter-spacing: 1.4px; color: ${palette.primary700}; font-weight: 700; margin: 5.5mm 0 2.5mm; display: flex; align-items: center; gap: 3mm; break-after: avoid; page-break-after: avoid; }
    .gh-h2::before { content: ""; width: 8mm; height: 3px; background: ${palette.primary600}; border-radius: 1.5px; }
    .gh-summary { font-size: 9.4pt; line-height: 1.55; color: #1e293b; }
    .gh-job { display: grid; grid-template-columns: 38mm 1fr; gap: 5mm; margin-bottom: 4mm; page-break-inside: avoid; break-inside: avoid; }
    .gh-jobmeta { font-size: 8.4pt; color: #6b7280; }
    .gh-jobmeta .co { color: ${palette.primary700}; font-weight: 700; font-size: 9pt; display: block; margin-bottom: 0.5mm; }
    .gh-jobmeta .dates { display: block; margin-top: 0.5mm; }
    .gh-jobtitle { font-size: 10pt; font-weight: 700; color: #111827; margin-bottom: 1.2mm; }
    .gh-job ul { list-style: none; padding: 0; margin: 0; }
    .gh-job li { font-size: 8.9pt; line-height: 1.45; padding-left: 5mm; position: relative; margin-bottom: 1mm; color: #27272a; }
    .gh-job li::before { content: ""; position: absolute; left: 0; top: 1.7mm; width: 2.4mm; height: 2.4mm; background: ${palette.primary600}; border-radius: 2px; transform: rotate(45deg); }
    .gh-chips { display: flex; flex-wrap: wrap; gap: 1.5mm; }
    .gh-chip { background: linear-gradient(135deg, ${palette.primary50}, ${palette.primary100}); border: 1px solid ${palette.primary200}; color: ${palette.primary900}; padding: 0.6mm 2.4mm; border-radius: 999px; font-size: 8pt; font-weight: 600; }
    .gh-skill-row { display: grid; grid-template-columns: 38mm 1fr; gap: 5mm; margin-bottom: 1.4mm; font-size: 9pt; page-break-inside: avoid; break-inside: avoid; }
    .gh-skill-label { color: ${palette.primary700}; font-weight: 700; display: flex; align-items: center; gap: 1.8mm; }
    .gh-skill-icon { width: 1em; height: 1em; color: ${palette.primary600}; flex-shrink: 0; }
    .gh-proj { border-left: 3px solid ${palette.primary600}; padding: 0 0 0 4mm; margin-bottom: 3mm; page-break-inside: avoid; break-inside: avoid; }
    .gh-projhead { display: flex; justify-content: space-between; align-items: baseline; }
    .gh-projname { font-size: 9.6pt; font-weight: 700; color: #111827; }
    .gh-projdesc { font-size: 8.8pt; color: #374151; margin-top: 0.8mm; line-height: 1.45; }
    .gh-edu { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.5mm; page-break-inside: avoid; break-inside: avoid; }
    .gh-edutitle { font-weight: 700; color: #111827; font-size: 9.3pt; }
    .gh-eduschool { color: ${palette.primary700}; font-size: 8.8pt; }
    .gh-edumeta { color: #6b7280; font-size: 8.4pt; font-style: italic; }
    .gh-two { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
    .gh-cert { font-size: 8.6pt; margin-bottom: 1.5mm; }
    .gh-cert strong { color: #111827; display: block; }
    .gh-kv { font-size: 8.6pt; margin-bottom: 1.2mm; }
    .gh-kv strong { color: #111827; }
  `;

  const atoms: React.ReactNode[] = [];

  atoms.push(
    <header className="gh-head" key="head">
      <div className="gh-logo">
        {resume.profile.photoUrl ? (
          <img src={resume.profile.photoUrl} alt="" className="gh-photo" />
        ) : logo ? (
          <logo.Icon style={{ width: "10mm", height: "10mm", color: "white" }} />
        ) : (
          <span style={{ fontSize: "14pt", fontWeight: 700 }}>
            {resume.profile.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </span>
        )}
      </div>
      <div>
        <h1 className="gh-name">{resume.profile.name}</h1>
        <div className="gh-title">{resume.profile.title}</div>
        <div className="gh-contact">
          {resume.contact.map((c) => (
            <span key={c.id}>
              {contactIcon(c.kind, 11)}
              {c.value}
            </span>
          ))}
        </div>
      </div>
    </header>,
  );

  if (resume.profile.summary) {
    atoms.push(
      <h2 className="gh-h2" data-keep-with-next="true" key="summary-h">
        Summary
      </h2>,
      <p className="gh-summary" key="summary-p">
        <RichText value={resume.profile.summary} />
      </p>,
    );
  }

  if (resume.experience.length > 0) {
    atoms.push(
      <h2 className="gh-h2" data-keep-with-next="true" key="exp-h">
        Experience
      </h2>,
    );
    resume.experience.forEach((job) => {
      atoms.push(
        <div className="gh-job" key={`exp-${job.id}`}>
          <div className="gh-jobmeta">
            <span className="co">{job.company}</span>
            {job.location}
            <span className="dates">
              {job.start}
              {job.end ? ` – ${job.end}` : ""}
            </span>
          </div>
          <div>
            <div className="gh-jobtitle">{job.title}</div>
            <ul>
              {job.bullets.map((b, i) => (
                // oxlint-disable-next-line jsx/no-array-index-key
                <li key={i}>
                  <RichText value={b} />
                </li>
              ))}
            </ul>
          </div>
        </div>,
      );
    });
  }

  if (resume.skills.length > 0) {
    atoms.push(
      <h2 className="gh-h2" data-keep-with-next="true" key="skills-h">
        Skills
      </h2>,
    );
    resume.skills.forEach((g) => {
      const GroupIcon = findLogoIcon(g.iconName)?.Icon;
      atoms.push(
        <div key={`skills-${g.id}`} className="gh-skill-row">
          <div className="gh-skill-label">
            {GroupIcon && <GroupIcon className="gh-skill-icon" />}
            <span>{g.label}</span>
          </div>
          <div>
            <div className="gh-chips">
              {splitSkills(g.items).map((s, i) => (
                // oxlint-disable-next-line jsx/no-array-index-key
                <span className="gh-chip" key={i}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>,
      );
    });
  }

  if (resume.projects.length > 0) {
    atoms.push(
      <h2 className="gh-h2" data-keep-with-next="true" key="proj-h">
        Projects
      </h2>,
    );
    resume.projects.forEach((p) => {
      atoms.push(
        <div className="gh-proj" key={`proj-${p.id}`}>
          <div className="gh-projhead">
            <div className="gh-projname">{p.name}</div>
          </div>
          <div className="gh-projdesc">
            <RichText value={p.description} />
            {p.role ? ` ${p.role}` : ""}
          </div>
          {p.stack.length > 0 && (
            <div className="gh-chips" style={{ marginTop: "1.2mm" }}>
              {p.stack.map((s, i) => (
                // oxlint-disable-next-line jsx/no-array-index-key
                <span className="gh-chip" key={i}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>,
      );
    });
  }

  if (resume.education.length > 0) {
    atoms.push(
      <h2 className="gh-h2" data-keep-with-next="true" key="edu-h">
        Education
      </h2>,
    );
    resume.education.forEach((ed) => {
      atoms.push(
        <div className="gh-edu" key={`edu-${ed.id}`}>
          <div>
            <div className="gh-edutitle">{ed.degree}</div>
            <div className="gh-eduschool">
              {ed.school}
              {ed.location ? `, ${ed.location}` : ""}
            </div>
          </div>
          <div className="gh-edumeta">
            {ed.start}
            {ed.end ? ` – ${ed.end}` : ""}
            {ed.detail ? ` · ${ed.detail}` : ""}
          </div>
        </div>,
      );
    });
  }

  // Credentials: 2-col grid — single atom preserves grid layout.
  if (resume.certifications.length > 0 || resume.awards.length > 0) {
    atoms.push(
      <div className="gh-two" key="rec">
        {resume.certifications.length > 0 && (
          <div>
            <h2 className="gh-h2">Certifications</h2>
            {resume.certifications.map((c) => (
              <div className="gh-cert" key={c.id}>
                <strong>{c.name}</strong>
                {c.issuer}
                {c.year ? ` · ${c.year}` : ""}
              </div>
            ))}
          </div>
        )}
        {resume.awards.length > 0 && (
          <div>
            <h2 className="gh-h2">Awards</h2>
            {resume.awards.map((a) => (
              <div className="gh-cert" key={a.id}>
                <strong>
                  {a.title}
                  {a.year ? ` · ${a.year}` : ""}
                </strong>
                {a.detail}
              </div>
            ))}
          </div>
        )}
      </div>,
    );
  }

  if (resume.languages.length > 0) {
    atoms.push(
      <h2 className="gh-h2" data-keep-with-next="true" key="lang-h">
        Languages
      </h2>,
      <div className="gh-chips" key="lang-v">
        {resume.languages.map((l) => (
          <span className="gh-chip" key={l.id}>
            {l.name} · {l.level}
          </span>
        ))}
      </div>,
    );
  }

  if (resume.tools.length > 0) {
    atoms.push(
      <h2 className="gh-h2" data-keep-with-next="true" key="tools-h">
        {resume.toolsLabel?.trim() || "Tools"}
      </h2>,
      <div className="gh-chips" key="tools-v">
        {resume.tools.map((t, i) => (
          // oxlint-disable-next-line jsx/no-array-index-key
          <span className="gh-chip" key={i}>
            {t}
          </span>
        ))}
      </div>,
    );
  }

  if (resume.interests.length > 0) {
    atoms.push(
      <h2 className="gh-h2" data-keep-with-next="true" key="int-h">
        {resume.interestsLabel?.trim() || "Interests"}
      </h2>,
      <div className="gh-chips" key="int-v">
        {resume.interests.map((t, i) => (
          // oxlint-disable-next-line jsx/no-array-index-key
          <span className="gh-chip" key={i}>
            {t}
          </span>
        ))}
      </div>,
    );
  }

  if (resume.extras.length > 0) {
    resume.extras.forEach((x) => {
      atoms.push(
        <div className="gh-kv" key={`extras-${x.id}`}>
          <strong>{x.label}:</strong> {x.value}
        </div>,
      );
    });
  }

  return (
    <>
      <style>{css}</style>
      <PaginatedCanvas mainPaddingMm={[8, 14]} pageClassName="gh-root">
        {atoms}
      </PaginatedCanvas>
    </>
  );
}
