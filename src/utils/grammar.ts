/**
 * Grammar / spelling analysis for the ATS review.
 *
 * Runs the retext pipeline in a Web Worker so the ~700 KB English
 * dictionary doesn't land in the main bundle. The panel drives this
 * lazily — the worker is only spawned when the user opens the review.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { GrammarReport, GrammarSegment, ResumeData } from "../types.ts";

/** Strip markdown emphasis so retext doesn't flag markers as spelling errors. */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^\\])\*([^*]+)\*/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1");
}

/**
 * Flatten the resume into labelled prose segments for per-field scoring.
 * Only free-form writing fields are included — structured fields (dates,
 * skill tags, names of people/companies) would produce pure noise.
 */
export function buildGrammarSegments(resume: ResumeData): GrammarSegment[] {
  const out: GrammarSegment[] = [];
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

interface WorkerResponse {
  id: number;
  issues: GrammarReport["issues"];
  wordsChecked: number;
}

export interface UseGrammarScan {
  /** Latest completed report, or null if nothing has been scanned yet. */
  report: GrammarReport | null;
  /** True while a scan is in flight. */
  scanning: boolean;
  /** Trigger a fresh scan. Subsequent calls cancel any in-flight request. */
  scan: () => void;
}

/**
 * Spawns the grammar worker lazily and exposes imperative `scan()`.
 * Multiple `scan()` calls are debounced internally by correlating request
 * ids — only the latest request's response is written back to state.
 */
export function useGrammarScan(resume: ResumeData): UseGrammarScan {
  const [report, setReport] = useState<GrammarReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const latestIdRef = useRef(0);
  const resumeRef = useRef(resume);

  useEffect(() => {
    resumeRef.current = resume;
  }, [resume]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const scan = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL("../workers/grammar.worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current.addEventListener("message", (e: MessageEvent<WorkerResponse>) => {
        if (e.data.id !== latestIdRef.current) return;
        setReport({ issues: e.data.issues, wordsChecked: e.data.wordsChecked });
        setScanning(false);
      });
    }
    const id = ++latestIdRef.current;
    const segments = buildGrammarSegments(resumeRef.current);
    setScanning(true);
    workerRef.current.postMessage({ id, segments });
  }, []);

  return { report, scanning, scan };
}
