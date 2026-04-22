/**
 * Grammar / spelling / style analysis powered by Harper.
 *
 * Harper is a Rust grammar checker compiled to WebAssembly — it runs in a
 * dedicated worker (owned by `WorkerLinter`) so main-thread keystrokes
 * stay buttery. The WASM payload is ~18 MB raw / ~7 MB gzipped, so the
 * download is surfaced as visible progress on the first analysis tap.
 *
 * Once loaded, the linter is held in module-level state for the lifetime
 * of the tab — subsequent scans don't re-download or re-instantiate.
 *
 * Nothing leaves the browser; everything (binary, dictionary, rules) is
 * bundled at build time.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { GrammarIssue, GrammarIssueKind, GrammarReport, ResumeData } from "../types.ts";

/** Strip markdown emphasis so the linter doesn't flag `**`/`*`/backticks as prose errors. */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^\\])\*([^*]+)\*/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1");
}

/**
 * Flatten the résumé into labelled prose segments. Only free-form writing
 * fields are included — structured fields (names, employers, dates) would
 * produce pure noise.
 */
export function buildGrammarSegments(resume: ResumeData) {
  const out: Array<{ id: string; label: string; text: string }> = [];
  const summary = resume.profile.summary.trim();
  if (summary) {
    out.push({
      id: "profile.summary",
      label: "Professional summary",
      text: stripMarkdown(summary),
    });
  }
  resume.experience.forEach((role, i) => {
    const roleLabel = role.title.trim() || role.company.trim() || `Role #${i + 1}`;
    role.bullets.forEach((b, bi) => {
      const trimmed = b.trim();
      if (!trimmed) return;
      out.push({
        id: `experience.${i}.bullets.${bi}`,
        label: `${roleLabel} · bullet ${bi + 1}`,
        text: stripMarkdown(trimmed),
      });
    });
  });
  resume.projects.forEach((p, i) => {
    const projLabel = p.name.trim() || `Project #${i + 1}`;
    const desc = p.description.trim();
    if (desc) {
      out.push({
        id: `projects.${i}.description`,
        label: `${projLabel} · description`,
        text: stripMarkdown(desc),
      });
    }
  });
  resume.awards.forEach((a, i) => {
    const detail = a.detail.trim();
    if (detail) {
      out.push({
        id: `awards.${i}.detail`,
        label: `${a.title.trim() || `Award #${i + 1}`} · detail`,
        text: stripMarkdown(detail),
      });
    }
  });
  return out;
}

/**
 * Map Harper's rich lint kinds into the four buckets the ATS panel cares
 * about. Anything Harper considers "Style" (passive voice, wordiness,
 * clarity) lands in the style bucket; punctuation/agreement/tense land in
 * grammar; spelling is its own; repetition piggybacks on grammar so
 * "the the" isn't buried as style.
 */
function classify(rawKind: string): GrammarIssueKind {
  const k = rawKind.toLowerCase();
  if (k.includes("spell") || k.includes("misspell")) return "spelling";
  if (k.includes("style") || k.includes("passive") || k.includes("word")) return "style";
  if (k.includes("read") || k.includes("sentence") || k.includes("clarity")) return "readability";
  return "grammar";
}

/** Count words in the segment for issue-density scoring. */
function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

type HarperLinter = {
  setup(): Promise<void>;
  lint(
    text: string,
    options?: { language?: "plaintext" | "markdown" },
  ): Promise<
    Array<{
      get_problem_text(): string;
      lint_kind_pretty(): string;
      message(): string;
      suggestions(): Array<{ get_replacement_text(): string }>;
    }>
  >;
  importWords(words: string[]): Promise<void>;
};

/**
 * Acronyms, product names, and newer tech/AI jargon that Harper's curated
 * dictionary may still flag. Imported once per linter lifetime.
 */
const PERSONAL_DICTIONARY = [
  "agentic",
  "multimodal",
  "observability",
  "autoscaling",
  "containerization",
  "dockerized",
  "kubernetes",
  "microservices",
  "microservice",
  "serverless",
  "roadmap",
  "roadmaps",
  "upskilling",
  "reskilling",
  "onboarding",
  "offboarding",
  "fullstack",
  "webhook",
  "webhooks",
  "backend",
  "frontend",
  "MLOps",
  "DevOps",
  "GraphQL",
  "Kubernetes",
  "TypeScript",
  "JavaScript",
  "Postgres",
  "PostgreSQL",
  "MongoDB",
  "SaaS",
  "PaaS",
  "IaaS",
  "APIs",
  "LLM",
  "LLMs",
  "RAG",
  "OKRs",
  "KPIs",
  "NPS",
  "ARR",
  "MRR",
  "GTM",
];

/**
 * Fetch Harper's WASM with a streaming reader so callers can render
 * byte-level progress, then hand it to a WorkerLinter as a blob URL.
 * The blob is document-scoped and survives until the tab closes, so
 * repeat scans reuse the cached linter instance.
 */
async function loadLinter(onProgress: (pct: number) => void): Promise<HarperLinter> {
  // Importing `harper.js/binary` makes Vite fingerprint + emit the .wasm
  // and sets `binary.url` to the resolved asset URL. We piggyback on that
  // URL to do our own progress-tracked fetch.
  const [{ binary }, { createBinaryModuleFromUrl, WorkerLinter, Dialect }] = await Promise.all([
    import("harper.js/binary"),
    import("harper.js"),
  ]);

  const wasmUrl = binary.url.toString();
  const resp = await fetch(wasmUrl);
  if (!resp.ok || !resp.body) {
    throw new Error(`Failed to fetch Harper WASM: ${resp.status}`);
  }
  const total = Number(resp.headers.get("content-length") ?? 0);
  const reader = resp.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  // Report initial activity so the UI leaves zero-state immediately even
  // when the server doesn't send Content-Length.
  onProgress(total ? 0 : 0.05);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    received += value.length;
    if (total) onProgress(Math.min(0.99, received / total));
  }
  onProgress(1);

  const blob = new Blob(chunks as BlobPart[], { type: "application/wasm" });
  const blobUrl = URL.createObjectURL(blob);
  const customBinary = createBinaryModuleFromUrl(blobUrl);
  const linter = new WorkerLinter({
    binary: customBinary,
    dialect: Dialect.American,
  }) as unknown as HarperLinter;
  await linter.setup();
  await linter.importWords(PERSONAL_DICTIONARY);
  return linter;
}

/**
 * Filter out spelling hits on capitalised proper-noun-looking tokens.
 * Résumés are full of names, employers, and products that neither Harper's
 * curated dictionary nor our personal list will know about; flagging every
 * one drowns real typos.
 */
function isProperNoun(actual: string): boolean {
  return /^[A-Z]/.test(actual) && !/^[A-Z]+$/.test(actual);
}

export interface UseGrammarScan {
  /** Latest completed report, or null if nothing has been scanned yet. */
  report: GrammarReport | null;
  /** True while a scan is in flight (includes first-time engine download). */
  scanning: boolean;
  /** True once the Harper WASM is loaded and the linter is ready. */
  engineReady: boolean;
  /** 0…1 download fraction of the Harper WASM. 0 before a scan is requested. */
  engineProgress: number;
  /** Trigger a fresh scan. First call also downloads + instantiates Harper. */
  scan: () => void;
}

export function useGrammarScan(resume: ResumeData): UseGrammarScan {
  const [report, setReport] = useState<GrammarReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [engineProgress, setEngineProgress] = useState(0);
  const linterRef = useRef<HarperLinter | null>(null);
  const linterPromiseRef = useRef<Promise<HarperLinter> | null>(null);
  const latestRequestRef = useRef(0);
  const resumeRef = useRef(resume);

  useEffect(() => {
    resumeRef.current = resume;
  }, [resume]);

  const scan = useCallback(() => {
    const requestId = ++latestRequestRef.current;
    setScanning(true);

    const ensureLinter = async (): Promise<HarperLinter> => {
      if (linterRef.current) return linterRef.current;
      if (!linterPromiseRef.current) {
        linterPromiseRef.current = loadLinter((pct) => {
          setEngineProgress(pct);
        }).then((linter) => {
          linterRef.current = linter;
          setEngineReady(true);
          return linter;
        });
      }
      return linterPromiseRef.current;
    };

    void (async () => {
      try {
        const linter = await ensureLinter();
        const segments = buildGrammarSegments(resumeRef.current);
        const issues: GrammarIssue[] = [];
        let wordsChecked = 0;
        for (const seg of segments) {
          wordsChecked += countWords(seg.text);
          const lints = await linter.lint(seg.text, { language: "plaintext" });
          for (const lint of lints) {
            const rawKind = lint.lint_kind_pretty();
            const kind = classify(rawKind);
            const actual = lint.get_problem_text();
            if (kind === "spelling" && isProperNoun(actual)) continue;
            const suggestions = lint
              .suggestions()
              .map((s) => s.get_replacement_text())
              .filter((s) => s.length > 0)
              .slice(0, 3);
            issues.push({
              segmentId: seg.id,
              segmentLabel: seg.label,
              kind,
              actual,
              suggestions,
              reason: lint.message(),
            });
          }
        }
        if (requestId !== latestRequestRef.current) return;
        setReport({ issues, wordsChecked });
        setScanning(false);
      } catch {
        if (requestId !== latestRequestRef.current) return;
        // Engine failures degrade silently — the ATS score just omits the
        // writing dimension rather than breaking the entire review.
        setReport({ issues: [], wordsChecked: 0 });
        setScanning(false);
      }
    })();
  }, []);

  return { report, scanning, engineReady, engineProgress, scan };
}
