/**
 * Applicant Tracking System (ATS) scoring.
 *
 * The scorer evaluates the resume data across several dimensions that
 * real-world ATS pipelines care about — contact completeness, keyword
 * relevance, quantifiable impact in bullets, action-verb usage, summary
 * length, structural markers like education & skills, and an optional
 * target job description match.
 *
 * Scoring is deterministic and purely local: nothing ever leaves the
 * browser.
 */

import type { AtsIssue, AtsReport, GrammarIssue, GrammarReport, ResumeData } from "../types.ts";

const ACTION_VERBS = new Set([
  "architected",
  "built",
  "created",
  "delivered",
  "designed",
  "developed",
  "drove",
  "drive",
  "engineered",
  "established",
  "expanded",
  "improved",
  "increased",
  "integrated",
  "launched",
  "led",
  "leveraged",
  "managed",
  "mentored",
  "migrated",
  "optimised",
  "optimized",
  "owned",
  "pioneered",
  "reduced",
  "refactored",
  "resolved",
  "scaled",
  "shipped",
  "spearheaded",
  "standardised",
  "standardized",
  "streamlined",
  "transformed",
  "translated",
  "unblocked",
  "rolled",
  "recognised",
  "recognized",
  "implemented",
]);

/** Regex covering metric-like strings: percentages, money, multipliers, counts. */
const METRIC_RE =
  /(\d+[\d,.]*\s*(?:%|x|×|k|m|b|\+|\/)|\$\s*\d+[\d,.]*|\d+[\d,.]*\s*(?:years?|months?|markets?|customers?|users?|teams?|projects?|apps?|solutions?))/i;

/**
 * Lorem-ipsum vocabulary. A single occurrence is meaningless (Latin shows up
 * in real resumes — "ad hoc", "et al.") but a high density of these tokens in
 * prose is a near-certain signal of placeholder content.
 */
const LOREM_WORDS = new Set([
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "eiusmod",
  "tempor",
  "incididunt",
  "labore",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "proident",
  "culpa",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "est",
]);

/**
 * Distinctively-English function words. Real English prose contains these at
 * ~15-30% density; lorem ipsum and most non-English gibberish land far below
 * that. Intentionally excludes short words that collide with Latin ("in", "a",
 * "ut", "et") so the check isn't fooled by lorem.
 */
const ENGLISH_MARKERS = new Set([
  "the",
  "and",
  "of",
  "for",
  "with",
  "to",
  "that",
  "this",
  "from",
  "was",
  "were",
  "been",
  "have",
  "has",
  "had",
  "will",
  "our",
  "we",
  "my",
  "your",
  "their",
  "they",
  "are",
  "is",
  "not",
  "which",
  "who",
  "while",
  "across",
  "over",
  "into",
  "through",
  "using",
  "built",
  "led",
]);

/** Tokenise a blob of resume text, lower-cased and stripped of punctuation. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-/\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Collapse the whole resume into a single searchable lowercase string. */
function flatten(resume: ResumeData): string {
  const parts: string[] = [];
  parts.push(resume.profile.name, resume.profile.title, resume.profile.summary);
  for (const c of resume.contact) parts.push(c.value);
  for (const s of resume.skills) parts.push(s.label, s.items);
  for (const e of resume.experience) {
    parts.push(e.title, e.company, e.location, e.start, e.end);
    parts.push(...e.bullets);
  }
  for (const ed of resume.education) {
    parts.push(ed.degree, ed.school, ed.location, ed.detail);
  }
  for (const p of resume.projects) {
    parts.push(p.name, p.description, p.role ?? "", ...p.stack);
  }
  for (const ct of resume.certifications) parts.push(ct.issuer, ct.name);
  for (const a of resume.awards) parts.push(a.title, a.detail);
  for (const l of resume.languages) parts.push(l.name, l.level);
  parts.push(...resume.interests, ...resume.tools);
  return parts.join(" ").toLowerCase();
}

/** Count all words in the resume body (summary, bullets, project descriptions). */
function wordCount(resume: ResumeData): number {
  const text = [
    resume.profile.summary,
    ...resume.experience.flatMap((e) => e.bullets),
    ...resume.projects.map((p) => `${p.description} ${p.role ?? ""}`),
  ].join(" ");
  return tokenize(text).length;
}

/** Extract distinctive keywords from a free-form job description blob. */
export function extractKeywords(jd: string): string[] {
  if (!jd.trim()) return [];
  const stop = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "of",
    "in",
    "on",
    "for",
    "to",
    "with",
    "by",
    "at",
    "from",
    "as",
    "is",
    "are",
    "be",
    "been",
    "being",
    "will",
    "shall",
    "this",
    "that",
    "these",
    "those",
    "you",
    "your",
    "we",
    "our",
    "their",
    "they",
    "it",
    "its",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "can",
    "could",
    "should",
    "would",
    "may",
    "might",
    "must",
    "not",
    "no",
    "yes",
    "into",
    "over",
    "under",
    "about",
    "within",
    "across",
    "per",
  ]);
  const freq = new Map<string, number>();
  const tokens = tokenize(jd);
  for (const t of tokens) {
    if (t.length < 3) continue;
    if (stop.has(t)) continue;
    if (/^\d+$/.test(t)) continue;
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([word]) => word);
}

function startsWithActionVerb(bullet: string): boolean {
  const first =
    bullet
      .trim()
      .split(/\s+/)[0]
      ?.toLowerCase()
      .replace(/[^a-z]/g, "") ?? "";
  return ACTION_VERBS.has(first);
}

/** Count a bullet as substantive only if it reads like a full clause. */
function isSubstantiveBullet(bullet: string): boolean {
  return tokenize(bullet).length >= 6;
}

interface ContentAuthenticity {
  loremRatio: number;
  englishRatio: number;
  proseTokenCount: number;
  isPlaceholder: boolean;
  isLowEnglish: boolean;
}

/**
 * Inspect the free-form prose of the resume (summary, bullets, project
 * descriptions) to flag placeholder or non-English content. Presence-only
 * sections (contact, education dates) are intentionally excluded — the check
 * is about whether the words the reader will actually read are real writing.
 */
function inspectAuthenticity(
  summary: string,
  bullets: string[],
  projectDescriptions: string[],
): ContentAuthenticity {
  const proseTokens = tokenize([summary, ...bullets, ...projectDescriptions].join(" "));
  const n = proseTokens.length;
  if (n === 0) {
    return {
      loremRatio: 0,
      englishRatio: 0,
      proseTokenCount: 0,
      isPlaceholder: false,
      isLowEnglish: false,
    };
  }
  let loremHits = 0;
  let englishHits = 0;
  for (const t of proseTokens) {
    if (LOREM_WORDS.has(t)) loremHits++;
    if (ENGLISH_MARKERS.has(t)) englishHits++;
  }
  const loremRatio = loremHits / n;
  const englishRatio = englishHits / n;
  // Any meaningful lorem density (>=8%) is placeholder — real resumes don't
  // contain "ipsum" or "consectetur" by accident.
  const isPlaceholder = loremRatio >= 0.08;
  // Below ~6% English markers in 40+ words of prose signals non-English or
  // gibberish. Needs a minimum sample so we don't penalise short resumes.
  const isLowEnglish = !isPlaceholder && n >= 40 && englishRatio < 0.06;
  return { loremRatio, englishRatio, proseTokenCount: n, isPlaceholder, isLowEnglish };
}

/**
 * Build a headline issue + suggestion pair for the most impactful grammar
 * problem of a given kind. Surfaces up to one issue per kind so the
 * Insights feed stays actionable instead of drowning in a flat list.
 */
function summariseGrammar(report: GrammarReport): AtsIssue[] {
  const out: AtsIssue[] = [];
  const byKind = new Map<GrammarIssue["kind"], GrammarIssue[]>();
  for (const issue of report.issues) {
    const existing = byKind.get(issue.kind) ?? [];
    existing.push(issue);
    byKind.set(issue.kind, existing);
  }
  const spelling = byKind.get("spelling") ?? [];
  if (spelling.length > 0) {
    const sample = spelling
      .slice(0, 3)
      .map((i) => `"${i.actual}"`)
      .join(", ");
    out.push({
      severity: spelling.length >= 3 ? "fail" : "warn",
      message: `${spelling.length} possible spelling issue${spelling.length === 1 ? "" : "s"} detected.`,
      suggestion: `Review ${sample}${spelling.length > 3 ? " and others" : ""} — open the Insights tab for fixes.`,
    });
  }
  const repeated = byKind.get("repeated") ?? [];
  if (repeated.length > 0) {
    out.push({
      severity: "warn",
      message: `Repeated words found (${repeated.length}).`,
      suggestion:
        'Remove accidental duplicates like "the the" — they slip past most spellcheckers.',
    });
  }
  const passive = byKind.get("passive") ?? [];
  if (passive.length >= 3) {
    out.push({
      severity: "info",
      message: `${passive.length} passive-voice phrases.`,
      suggestion: 'Recruiters favour active verbs. Rewrite "was delivered" as "delivered".',
    });
  }
  const readability = byKind.get("readability") ?? [];
  if (readability.length >= 2) {
    out.push({
      severity: "info",
      message: `${readability.length} hard-to-scan sentence${readability.length === 1 ? "" : "s"}.`,
      suggestion: "Split long bullets into two — recruiters spend ~6 seconds per résumé.",
    });
  }
  return out;
}

export function computeAts(
  resume: ResumeData,
  jobDescription: string = "",
  grammar?: GrammarReport | null,
): AtsReport {
  const issues: AtsIssue[] = [];
  const wins: string[] = [];
  const breakdown: AtsReport["breakdown"] = [];

  // ── Content authenticity ───────────────────────────────────────
  // Computed once up-front so every prose-driven category can honour it.
  // Structural categories (contact, education presence) are exempt — missing
  // contacts shouldn't be masked by a lorem ipsum penalty, and vice-versa.
  const proseBullets = resume.experience.flatMap((e) => e.bullets);
  const projectProse = resume.projects.map((p) => `${p.description} ${p.role ?? ""}`);
  const authenticity = inspectAuthenticity(resume.profile.summary, proseBullets, projectProse);
  if (authenticity.isPlaceholder) {
    issues.push({
      severity: "fail",
      message: "Résumé body contains placeholder (lorem ipsum) text.",
      suggestion:
        "Replace the sample copy with real summary, bullets, and project descriptions before exporting.",
    });
  } else if (authenticity.isLowEnglish) {
    issues.push({
      severity: "fail",
      message: "Prose doesn't read like natural English.",
      suggestion:
        "ATS keyword models expect plain-English sentences. Rewrite summary and bullets in full sentences.",
    });
  }
  const contentMultiplier = authenticity.isPlaceholder ? 0 : authenticity.isLowEnglish ? 0.3 : 1;

  // ── Contact completeness (max 10) ───────────────────────────────
  const kinds = new Set(resume.contact.map((c) => c.kind));
  const essential: ("email" | "phone" | "location" | "linkedin")[] = [
    "email",
    "phone",
    "location",
    "linkedin",
  ];
  const missingContacts = essential.filter((k) => !kinds.has(k));
  const contactEarned = Math.max(0, 10 - missingContacts.length * 3);
  breakdown.push({
    category: "Contact details",
    earned: contactEarned,
    max: 10,
    note:
      missingContacts.length === 0
        ? "All essential contacts present."
        : `Missing: ${missingContacts.join(", ")}`,
  });
  if (missingContacts.length > 0) {
    issues.push({
      severity: "warn",
      message: `Missing ${missingContacts.join(", ")} in contact block.`,
      suggestion: "Most ATS parsers expect email, phone, location, and LinkedIn.",
    });
  } else {
    wins.push("Contact block has email, phone, location, and LinkedIn.");
  }

  // ── Summary length (max 10) ─────────────────────────────────────
  const summaryWords = tokenize(resume.profile.summary).length;
  let summaryEarned = 0;
  let summaryNote = "";
  if (summaryWords === 0) {
    summaryNote = "No professional summary provided.";
    issues.push({
      severity: "fail",
      message: "Professional summary is empty.",
      suggestion: "Add a 50–100 word summary that leads with your role and impact.",
    });
  } else if (summaryWords < 30) {
    summaryEarned = 4;
    summaryNote = `Summary is only ${summaryWords} words — a little thin.`;
    issues.push({
      severity: "warn",
      message: "Summary is shorter than recruiters expect.",
      suggestion: "Aim for 50–100 words with role, experience, and headline wins.",
    });
  } else if (summaryWords <= 120) {
    summaryEarned = 10;
    summaryNote = `Summary is a healthy ${summaryWords} words.`;
    if (contentMultiplier === 1) {
      wins.push("Summary length is in the recruiter-friendly 50–120 word range.");
    }
  } else {
    summaryEarned = 6;
    summaryNote = `Summary is ${summaryWords} words — consider trimming.`;
    issues.push({
      severity: "info",
      message: "Summary runs a bit long.",
      suggestion: "Tighten to ≤120 words; move detail into experience bullets.",
    });
  }
  breakdown.push({
    category: "Professional summary",
    earned: Math.round(summaryEarned * contentMultiplier),
    max: 10,
    note: summaryNote,
  });

  // ── Experience bullets: count & action verbs (max 15) ───────────
  // Only full-clause bullets (>=6 words) count toward the count score —
  // placeholder fragments like "Lorem ipsum." shouldn't earn credit.
  const allBullets = proseBullets;
  const totalBullets = allBullets.length;
  const substantiveBullets = allBullets.filter(isSubstantiveBullet);
  const substantiveCount = substantiveBullets.length;
  let bulletEarned = 0;
  if (substantiveCount >= 10) bulletEarned = 8;
  else if (substantiveCount >= 6) bulletEarned = 6;
  else if (substantiveCount >= 3) bulletEarned = 4;
  else if (substantiveCount >= 1) bulletEarned = 2;
  const actionCount = substantiveBullets.filter(startsWithActionVerb).length;
  const actionRatio = substantiveCount === 0 ? 0 : actionCount / substantiveCount;
  const actionEarned = Math.round(actionRatio * 7);
  const bulletTotal = Math.round((bulletEarned + actionEarned) * contentMultiplier);
  breakdown.push({
    category: "Experience bullets",
    earned: bulletTotal,
    max: 15,
    note: `${totalBullets} bullets · ${actionCount} start with strong action verbs`,
  });
  if (substantiveCount < 6) {
    issues.push({
      severity: "warn",
      message: "Too few substantive experience bullets.",
      suggestion: "Aim for 3–5 full-sentence bullets per role, focused on outcomes.",
    });
  }
  if (substantiveCount > 0 && actionRatio < 0.6) {
    issues.push({
      severity: "warn",
      message: "Many bullets don't start with strong action verbs.",
      suggestion:
        "Lead every bullet with a verb like 'Architected', 'Delivered', 'Reduced', 'Shipped'.",
    });
  } else if (substantiveCount > 0 && contentMultiplier === 1) {
    wins.push("Most bullets lead with strong action verbs.");
  }

  // ── Quantifiable impact (max 15) ────────────────────────────────
  const metricBullets = substantiveBullets.filter((b) => METRIC_RE.test(b));
  const metricRatio = substantiveCount === 0 ? 0 : metricBullets.length / substantiveCount;
  const metricEarned = Math.round(metricRatio * 15 * contentMultiplier);
  breakdown.push({
    category: "Quantifiable impact",
    earned: metricEarned,
    max: 15,
    note: `${metricBullets.length} of ${substantiveCount} bullets include metrics (%, $, counts).`,
  });
  if (substantiveCount > 0 && metricBullets.length === 0) {
    issues.push({
      severity: "fail",
      message: "No bullets contain measurable outcomes.",
      suggestion:
        "Recruiters skim for numbers. Add at least one metric per role — e.g. 'reduced X by 40%', 'scaled to 5M users'.",
    });
  } else if (substantiveCount > 0 && metricRatio < 0.4) {
    issues.push({
      severity: "warn",
      message: "Few bullets include measurable outcomes.",
      suggestion:
        "Add numbers where possible — e.g. 'reduced EMI collection time by 40%', '5× award winner'.",
    });
  } else if (substantiveCount > 0 && contentMultiplier === 1) {
    wins.push("Several bullets contain measurable metrics.");
  }

  // ── Skills coverage (max 10) ────────────────────────────────────
  // Dedupe skills (case-insensitive) and drop lorem-ipsum tokens — otherwise
  // "Lorem, Ipsum, Dolor, Lorem, Ipsum, Dolor" would pass the breadth check.
  const skillSet = new Set<string>();
  for (const group of resume.skills) {
    for (const raw of group.items.split(",")) {
      const s = raw.trim().toLowerCase();
      if (!s) continue;
      if (LOREM_WORDS.has(s)) continue;
      skillSet.add(s);
    }
  }
  const skillItemCount = skillSet.size;
  let skillsEarned = 0;
  if (skillItemCount >= 20) skillsEarned = 10;
  else if (skillItemCount >= 10) skillsEarned = 7;
  else if (skillItemCount >= 5) skillsEarned = 4;
  breakdown.push({
    category: "Skills coverage",
    earned: skillsEarned,
    max: 10,
    note: `${skillItemCount} unique skills across ${resume.skills.length} groups`,
  });
  if (skillItemCount < 10) {
    issues.push({
      severity: "warn",
      message: "Skills section is light.",
      suggestion: "Add at least 10–20 relevant skills grouped by category.",
    });
  } else {
    wins.push("Skills section has good breadth.");
  }

  // ── Education present (max 5) ───────────────────────────────────
  const hasEducation = resume.education.length > 0;
  breakdown.push({
    category: "Education",
    earned: hasEducation ? 5 : 0,
    max: 5,
    note: hasEducation ? `${resume.education.length} entry/entries` : "No education entry.",
  });
  if (!hasEducation) {
    issues.push({
      severity: "warn",
      message: "No education entry provided.",
      suggestion: "Most ATS parsers flag missing education — add at least one entry.",
    });
  }

  // ── Projects (max 5) ────────────────────────────────────────────
  const projCount = resume.projects.length;
  const baseProjEarned = projCount >= 3 ? 5 : projCount >= 1 ? 3 : 0;
  const projEarned = Math.round(baseProjEarned * contentMultiplier);
  breakdown.push({
    category: "Projects",
    earned: projEarned,
    max: 5,
    note: `${projCount} project${projCount === 1 ? "" : "s"} listed`,
  });

  // ── Overall length (max 10) ─────────────────────────────────────
  const words = wordCount(resume);
  let baseLengthEarned = 0;
  const lengthNote = `${words} words across summary + bullets + projects`;
  if (words === 0) {
    baseLengthEarned = 0;
    issues.push({
      severity: "fail",
      message: "Resume body is empty.",
      suggestion: "Add a summary, experience bullets, or project descriptions before exporting.",
    });
  } else if (words < 250) {
    baseLengthEarned = 4;
    issues.push({
      severity: "warn",
      message: "Resume body is on the short side.",
      suggestion: "Aim for 250–900 words of substance — hiring managers scan for depth.",
    });
  } else if (words <= 900) {
    baseLengthEarned = 10;
    if (contentMultiplier === 1) {
      wins.push("Resume length is in the optimal 250–900 word range.");
    }
  } else {
    baseLengthEarned = 7;
    issues.push({
      severity: "info",
      message: "Resume body is long.",
      suggestion: "Consider trimming older or less relevant detail to stay under ~900 words.",
    });
  }
  const lengthEarned = Math.round(baseLengthEarned * contentMultiplier);
  breakdown.push({ category: "Overall length", earned: lengthEarned, max: 10, note: lengthNote });

  // ── Writing quality (max 10 when grammar report available) ──────
  // Scales by issue density so a long résumé with a few typos isn't
  // penalised as harshly as a short summary riddled with errors.
  if (grammar && grammar.wordsChecked >= 20) {
    const issueCount = grammar.issues.length;
    const per100 = (issueCount / grammar.wordsChecked) * 100;
    let writingEarned = 10;
    if (per100 >= 6) writingEarned = 0;
    else if (per100 >= 4) writingEarned = 4;
    else if (per100 >= 2) writingEarned = 7;
    else if (per100 >= 1) writingEarned = 9;
    breakdown.push({
      category: "Writing quality",
      earned: writingEarned,
      max: 10,
      note:
        issueCount === 0
          ? "No grammar or spelling issues detected."
          : `${issueCount} issue${issueCount === 1 ? "" : "s"} across ${grammar.wordsChecked} words`,
    });
    for (const grammarIssue of summariseGrammar(grammar)) issues.push(grammarIssue);
    if (issueCount === 0 && grammar.wordsChecked >= 100) {
      wins.push("Writing is clean — no spelling, grammar, or passive-voice flags.");
    }
  } else {
    breakdown.push({
      category: "Writing quality",
      earned: 0,
      max: 0,
      note: grammar ? "Add more prose to score writing quality." : "Writing scan hasn't run yet.",
    });
  }

  // ── Keyword match (max 20 when JD provided; 0 otherwise) ────────
  const matched: string[] = [];
  const missing: string[] = [];
  if (!jobDescription.trim()) {
    breakdown.push({
      category: "Keyword match",
      earned: 0,
      max: 0,
      note: "Paste a target job description to score keyword coverage.",
    });
  } else {
    const keywords = extractKeywords(jobDescription);
    const haystack = flatten(resume);
    for (const kw of keywords) {
      if (haystack.includes(kw)) matched.push(kw);
      else missing.push(kw);
    }
    if (keywords.length === 0) {
      // JD was non-empty but resolved to zero distinctive keywords (e.g. only
      // stop-words or numbers). Don't let that silently cost 20 points.
      breakdown.push({
        category: "Keyword match",
        earned: 0,
        max: 0,
        note: "Job description didn't contain scorable keywords.",
      });
    } else {
      const ratio = matched.length / keywords.length;
      breakdown.push({
        category: "Keyword match",
        earned: Math.round(ratio * 20),
        max: 20,
        note: `${matched.length} of ${keywords.length} JD keywords found in resume`,
      });
      if (ratio < 0.5) {
        issues.push({
          severity: "warn",
          message: "Less than half of the job description keywords appear in the resume.",
          suggestion: "Naturally weave the missing terms into summary, skills, or bullets.",
        });
      } else if (ratio >= 0.75) {
        wins.push("Strong keyword alignment with the provided job description.");
      }
    }
  }

  // ── Assemble ────────────────────────────────────────────────────
  const maxTotal = breakdown.reduce((acc, b) => acc + b.max, 0);
  const earnedTotal = breakdown.reduce((acc, b) => acc + b.earned, 0);
  let score = maxTotal === 0 ? 0 : Math.round((earnedTotal / maxTotal) * 100);

  // Hard ceiling when content is unusable — even perfect structure shouldn't
  // masquerade as an "Excellent" résumé if the words are placeholder text.
  if (authenticity.isPlaceholder) {
    score = Math.min(score, 15);
  } else if (authenticity.isLowEnglish) {
    score = Math.min(score, 35);
  }

  // Drop inherited wins when content integrity failed — a positive note next
  // to a "placeholder text detected" issue would read as contradictory.
  const finalWins = authenticity.isPlaceholder || authenticity.isLowEnglish ? [] : wins;

  return {
    score,
    breakdown,
    issues,
    wins: finalWins,
    keywords: { matched, missing },
    grammar: grammar ?? undefined,
  };
}

export function scoreBand(score: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  if (score >= 85)
    return { label: "Excellent", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
  if (score >= 70) return { label: "Strong", color: "#0D9488", bg: "#f0fdfa", border: "#99f6e4" };
  if (score >= 55) return { label: "Decent", color: "#D97706", bg: "#fffbeb", border: "#fde68a" };
  if (score >= 40)
    return { label: "Needs work", color: "#DC2626", bg: "#fef2f2", border: "#fecaca" };
  return { label: "Critical", color: "#B91C1C", bg: "#fef2f2", border: "#fca5a5" };
}
