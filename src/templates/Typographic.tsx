/**
 * Typographic template.
 *
 * Swiss-editorial layout built around large numbered section markers
 * (01, 02, …) set in the accent colour. The name is oversized and left-
 * aligned, the content sits on a tight two-column grid with generous
 * whitespace, and there are no boxes, pills, or icons — the entire
 * hierarchy is communicated through type size, weight, and the numbered
 * rail. Designed to stand out on a pile of safer templates while still
 * remaining print-friendly.
 *
 * Uses the shared `PaginatedCanvas` so long content flows onto
 * additional A4 pages at clean section boundaries; section numbering
 * stays sequential across pages.
 *
 * PAGINATION: list-style sections (Experience, Projects, Education,
 * Custom) emit one atom per item. The first atom of each section uses
 * `.tg-section` (rendering the numbered marker + top hairline), and
 * subsequent items use `.tg-section-cont` (empty 32mm column + no top
 * hairline) so they continue the signature grid without repeating the
 * marker. This lets long sections flow tightly across A4 pages instead
 * of pushing entire sections whole. Grid-body sections (Skills,
 * Credentials, More) stay as a single atom because their internal
 * multi-column grid can't be split across atoms.
 */

import { PaginatedCanvas } from "../components/PaginatedCanvas.tsx";
import type { ResumeData } from "../types.ts";
import type { PrimaryPalette } from "../utils/colors.ts";
import { RichText } from "../utils/richText.tsx";
import {
  certificationLink,
  formatDateRange,
  formatLocation,
  renderContactValue,
  splitSkills,
} from "./shared.tsx";

interface Props {
  resume: ResumeData;
  palette: PrimaryPalette;
}

export function Typographic({ resume, palette }: Props) {
  const css = `
    .tg-root { font-family: 'Geist', 'Inter', sans-serif; color: #111827; font-size: 9.4pt; line-height: 1.5; }
    .tg-head { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 6mm; border-bottom: 3px solid #111827; padding-bottom: 3mm; margin-bottom: 7mm; }
    .tg-name { font-size: 32pt; font-weight: 800; color: #0a0a0a; letter-spacing: -1.2px; line-height: 0.95; margin: 0; }
    .tg-title { font-size: 10pt; color: ${palette.primary700}; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin-top: 2mm; }
    .tg-handle { font-size: 9pt; color: #6b7280; text-align: right; font-variant-numeric: tabular-nums; line-height: 1.4; }
    .tg-handle strong { color: #0a0a0a; display: block; font-size: 9.4pt; font-weight: 700; margin-bottom: 0.5mm; letter-spacing: 0.3px; }
    .tg-contact { font-size: 9pt; color: #374151; }
    .tg-contact span { display: block; line-height: 1.45; }
    .tg-section { display: grid; grid-template-columns: 32mm 1fr; gap: 6mm; margin-bottom: 4.5mm; page-break-inside: avoid; break-inside: avoid; }
    .tg-section-cont { display: grid; grid-template-columns: 32mm 1fr; gap: 6mm; margin-bottom: 4.5mm; page-break-inside: avoid; break-inside: avoid; }
    .tg-section-end { margin-bottom: 7mm; }
    .tg-marker { border-top: 1px solid #111827; padding-top: 2mm; }
    .tg-marker-num { font-size: 22pt; font-weight: 800; color: ${palette.primary600}; line-height: 0.9; letter-spacing: -0.6px; font-variant-numeric: tabular-nums; }
    .tg-marker-label { font-size: 9pt; text-transform: uppercase; letter-spacing: 2.4px; color: #111827; font-weight: 700; margin-top: 2mm; }
    .tg-body { border-top: 1px solid #111827; padding-top: 2.5mm; }
    .tg-body-cont { padding-top: 0; }
    .tg-body > *:last-child, .tg-body-cont > *:last-child { margin-bottom: 0; }
    .tg-summary { font-size: 10.4pt; line-height: 1.6; color: #111827; max-width: 148mm; font-weight: 400; letter-spacing: -0.1px; }
    .tg-job { display: grid; grid-template-columns: 32mm 1fr; gap: 4mm; margin-bottom: 4.5mm; page-break-inside: avoid; break-inside: avoid; }
    .tg-job:last-child { margin-bottom: 0; }
    .tg-job-meta { font-size: 8.8pt; color: #6b7280; font-variant-numeric: tabular-nums; line-height: 1.4; }
    .tg-job-meta .yr { color: #0a0a0a; font-weight: 700; display: block; font-size: 9pt; margin-bottom: 0.5mm; }
    .tg-job-title { font-size: 11pt; font-weight: 700; color: #0a0a0a; letter-spacing: -0.2px; line-height: 1.2; }
    .tg-job-co { font-size: 9.4pt; color: ${palette.primary700}; font-weight: 600; margin: 0.8mm 0 1.5mm; }
    .tg-job ul { list-style: none; padding: 0; margin: 0; }
    .tg-job li { font-size: 9.4pt; line-height: 1.5; padding-left: 5mm; position: relative; margin-bottom: 1mm; color: #1f2937; }
    .tg-job li::before { content: "›"; position: absolute; left: 0; color: ${palette.primary600}; font-weight: 800; font-size: 10pt; line-height: 1.3; }
    .tg-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 6mm; }
    .tg-skill { margin-bottom: 2mm; page-break-inside: avoid; break-inside: avoid; }
    .tg-skill-label { font-size: 9.2pt; font-weight: 700; color: #0a0a0a; letter-spacing: 0.2px; margin-bottom: 0.5mm; }
    .tg-skill-list { font-size: 9.2pt; color: #374151; line-height: 1.5; }
    .tg-edu { margin-bottom: 3mm; page-break-inside: avoid; break-inside: avoid; }
    .tg-edu-head { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; }
    .tg-edu-title { font-size: 10pt; font-weight: 700; color: #0a0a0a; }
    .tg-edu-meta { font-size: 8.8pt; color: #6b7280; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .tg-edu-school { font-size: 9.2pt; color: ${palette.primary700}; font-weight: 600; margin-top: 0.5mm; }
    .tg-edu-detail { font-size: 9pt; color: #6b7280; font-style: italic; margin-top: 0.3mm; }
    .tg-proj { margin-bottom: 3.5mm; page-break-inside: avoid; break-inside: avoid; }
    .tg-proj-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4mm; align-items: baseline; border-bottom: 1px dotted #d1d5db; padding-bottom: 1mm; margin-bottom: 1.2mm; }
    .tg-proj-name { font-size: 10.2pt; font-weight: 700; color: #0a0a0a; min-width: 0; }
    .tg-proj-role { font-size: 8.8pt; color: #6b7280; font-style: italic; text-align: right; max-width: 60mm; }
    .tg-proj-desc { font-size: 9.2pt; color: #1f2937; line-height: 1.5; margin-bottom: 0.8mm; }
    .tg-proj-stack { font-size: 8.6pt; color: ${palette.primary700}; font-weight: 600; letter-spacing: 0.1px; }
    .tg-cert, .tg-award, .tg-lang { font-size: 9.2pt; margin-bottom: 1.4mm; color: #1f2937; }
    .tg-cert strong, .tg-award strong, .tg-lang strong { color: #0a0a0a; font-weight: 700; }
    .tg-cert .meta, .tg-award .meta, .tg-lang .meta { color: #6b7280; font-variant-numeric: tabular-nums; }
    .tg-inline { font-size: 9.2pt; color: #1f2937; line-height: 1.55; }
    .tg-inline strong { color: #0a0a0a; font-weight: 700; }
    .tg-extra { font-size: 9.2pt; margin-bottom: 1mm; color: #1f2937; }
    .tg-extra strong { color: #0a0a0a; font-weight: 700; }
  `;

  const padNum = (n: number) => String(n).padStart(2, "0");
  let sectionNum = 0;
  const next = () => padNum(++sectionNum);

  const atoms: React.ReactNode[] = [];

  atoms.push(
    <header className="tg-head" key="head">
      <div>
        <h1 className="tg-name">{resume.profile.name}</h1>
        {resume.profile.title && <div className="tg-title">{resume.profile.title}</div>}
      </div>
      {resume.contact.length > 0 && (
        <div className="tg-handle">
          <strong>Contact</strong>
          <div className="tg-contact">
            {resume.contact.map((c) => (
              <span key={c.id}>{renderContactValue(c)}</span>
            ))}
          </div>
        </div>
      )}
    </header>,
  );

  if (resume.profile.summary) {
    const num = next();
    atoms.push(
      <section className="tg-section tg-section-end" key="about">
        <div className="tg-marker">
          <div className="tg-marker-num">{num}</div>
          <div className="tg-marker-label">About</div>
        </div>
        <div className="tg-body">
          <p className="tg-summary">
            <RichText value={resume.profile.summary} />
          </p>
        </div>
      </section>,
    );
  }

  if (resume.experience.length > 0) {
    const num = next();
    const last = resume.experience.length - 1;
    resume.experience.forEach((job, index) => {
      const isFirst = index === 0;
      const isLast = index === last;
      const className = `${isFirst ? "tg-section" : "tg-section-cont"}${isLast ? " tg-section-end" : ""}`;
      atoms.push(
        <section
          className={className}
          key={`exp-${job.id}`}
          data-keep-with-next={isFirst && !isLast ? "true" : undefined}
        >
          {isFirst ? (
            <div className="tg-marker">
              <div className="tg-marker-num">{num}</div>
              <div className="tg-marker-label">Experience</div>
            </div>
          ) : (
            <div />
          )}
          <div className={isFirst ? "tg-body" : "tg-body-cont"}>
            <div className="tg-job">
              <div className="tg-job-meta">
                <span className="yr">{formatDateRange(job.start, job.end)}</span>
                {job.location}
              </div>
              <div>
                <div className="tg-job-title">{job.title}</div>
                <div className="tg-job-co">{job.company}</div>
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
              </div>
            </div>
          </div>
        </section>,
      );
    });
  }

  if (resume.skills.length > 0) {
    const num = next();
    atoms.push(
      <section className="tg-section tg-section-end" key="skills">
        <div className="tg-marker">
          <div className="tg-marker-num">{num}</div>
          <div className="tg-marker-label">Skills</div>
        </div>
        <div className="tg-body">
          <div className="tg-grid-2">
            {resume.skills.map((g) => (
              <div className="tg-skill" key={g.id}>
                <div className="tg-skill-label">{g.label}</div>
                <div className="tg-skill-list">{splitSkills(g.items).join(", ")}</div>
              </div>
            ))}
          </div>
        </div>
      </section>,
    );
  }

  if (resume.projects.length > 0) {
    const num = next();
    const last = resume.projects.length - 1;
    resume.projects.forEach((p, index) => {
      const isFirst = index === 0;
      const isLast = index === last;
      const className = `${isFirst ? "tg-section" : "tg-section-cont"}${isLast ? " tg-section-end" : ""}`;
      atoms.push(
        <section
          className={className}
          key={`proj-${p.id}`}
          data-keep-with-next={isFirst && !isLast ? "true" : undefined}
        >
          {isFirst ? (
            <div className="tg-marker">
              <div className="tg-marker-num">{num}</div>
              <div className="tg-marker-label">Projects</div>
            </div>
          ) : (
            <div />
          )}
          <div className={isFirst ? "tg-body" : "tg-body-cont"}>
            <div className="tg-proj">
              <div className="tg-proj-head">
                <div className="tg-proj-name">{p.name}</div>
                {p.role && <div className="tg-proj-role">{p.role}</div>}
              </div>
              {p.description && (
                <div className="tg-proj-desc">
                  <RichText value={p.description} />
                </div>
              )}
              {p.stack.length > 0 && <div className="tg-proj-stack">{p.stack.join(" / ")}</div>}
            </div>
          </div>
        </section>,
      );
    });
  }

  if (resume.education.length > 0) {
    const num = next();
    const last = resume.education.length - 1;
    resume.education.forEach((ed, index) => {
      const isFirst = index === 0;
      const isLast = index === last;
      const className = `${isFirst ? "tg-section" : "tg-section-cont"}${isLast ? " tg-section-end" : ""}`;
      atoms.push(
        <section
          className={className}
          key={`edu-${ed.id}`}
          data-keep-with-next={isFirst && !isLast ? "true" : undefined}
        >
          {isFirst ? (
            <div className="tg-marker">
              <div className="tg-marker-num">{num}</div>
              <div className="tg-marker-label">Education</div>
            </div>
          ) : (
            <div />
          )}
          <div className={isFirst ? "tg-body" : "tg-body-cont"}>
            <div className="tg-edu">
              <div className="tg-edu-head">
                <div className="tg-edu-title">{ed.degree}</div>
                <div className="tg-edu-meta">{formatDateRange(ed.start, ed.end)}</div>
              </div>
              <div className="tg-edu-school">
                {ed.school}
                {formatLocation(ed.location)}
              </div>
              {ed.detail && <div className="tg-edu-detail">{ed.detail}</div>}
            </div>
          </div>
        </section>,
      );
    });
  }

  if (resume.certifications.length > 0 || resume.awards.length > 0) {
    const num = next();
    atoms.push(
      <section className="tg-section tg-section-end" key="cred">
        <div className="tg-marker">
          <div className="tg-marker-num">{num}</div>
          <div className="tg-marker-label">Credentials</div>
        </div>
        <div className="tg-body">
          <div className="tg-grid-2">
            {resume.certifications.length > 0 && (
              <div>
                {resume.certifications.map((c) => (
                  <div className="tg-cert" key={c.id}>
                    {certificationLink(c, <strong>{c.name}</strong>)}
                    {c.issuer ? ` — ${c.issuer}` : ""}
                    {c.year ? <span className="meta"> · {c.year}</span> : null}
                  </div>
                ))}
              </div>
            )}
            {resume.awards.length > 0 && (
              <div>
                {resume.awards.map((a) => (
                  <div className="tg-award" key={a.id}>
                    <strong>{a.title}</strong>
                    {a.detail ? ` — ${a.detail}` : ""}
                    {a.year ? <span className="meta"> · {a.year}</span> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>,
    );
  }

  if (
    resume.languages.length > 0 ||
    resume.interests.length > 0 ||
    resume.tools.length > 0 ||
    resume.extras.length > 0
  ) {
    const num = next();
    atoms.push(
      <section className="tg-section tg-section-end" key="more">
        <div className="tg-marker">
          <div className="tg-marker-num">{num}</div>
          <div className="tg-marker-label">More</div>
        </div>
        <div className="tg-body">
          {resume.languages.length > 0 && (
            <div className="tg-inline" style={{ marginBottom: "1.8mm" }}>
              <strong>Languages — </strong>
              {resume.languages
                .map((l) => (l.level ? `${l.name} (${l.level})` : l.name))
                .join(", ")}
            </div>
          )}
          {resume.tools.length > 0 && (
            <div className="tg-inline" style={{ marginBottom: "1.8mm" }}>
              <strong>{resume.toolsLabel?.trim() || "Tools"} — </strong>
              {resume.tools.join(", ")}
            </div>
          )}
          {resume.interests.length > 0 && (
            <div className="tg-inline" style={{ marginBottom: "1.8mm" }}>
              <strong>{resume.interestsLabel?.trim() || "Interests"} — </strong>
              {resume.interests.join(", ")}
            </div>
          )}
          {resume.extras.length > 0 &&
            resume.extras.map((x) => (
              <div className="tg-extra" key={x.id}>
                <strong>{x.label}:</strong> {x.value}
              </div>
            ))}
        </div>
      </section>,
    );
  }

  resume.custom
    .filter((c) => c.header.trim() && c.bullets.some((b) => b.trim()))
    .forEach((c) => {
      const n = next();
      atoms.push(
        <section className="tg-section tg-section-end" key={`custom-${c.id}`}>
          <div className="tg-marker">
            <div className="tg-marker-num">{n}</div>
            <div className="tg-marker-label">{c.header}</div>
          </div>
          <div className="tg-body">
            {c.bullets.length === 1 ? (
              <p className="tg-summary">
                <RichText value={c.bullets[0]} />
              </p>
            ) : (
              <div className="tg-job" style={{ display: "block" }}>
                <ul>
                  {c.bullets.map((b, i) => (
                    // oxlint-disable-next-line jsx/no-array-index-key
                    <li key={`${c.id}-b-${i}`}>
                      <RichText value={b} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>,
      );
    });

  return (
    <>
      <style>{css}</style>
      <PaginatedCanvas mainPaddingMm={[16, 18]} pageClassName="tg-root">
        {atoms}
      </PaginatedCanvas>
    </>
  );
}
