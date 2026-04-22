/**
 * Grammar / spelling worker. Runs retext + nspell off the main thread so
 * the ~700 KB English dictionary doesn't block input while the user types.
 *
 * The worker accepts one request at a time — a batch of labelled prose
 * segments — and returns every issue retext found, tagged with the
 * segment it originated from so the ATS Insights pane can show
 * "In Experience role #1, bullet #2: 'teh' → 'the'".
 *
 * Nothing here hits the network; everything is bundled at build time.
 */

import retextEnglish from "retext-english";
import retextPassive from "retext-passive";
import retextReadability from "retext-readability";
import retextRepeatedWords from "retext-repeated-words";
import retextSpell from "retext-spell";
import retextStringify from "retext-stringify";
import { unified } from "unified";
import type { GrammarIssue, GrammarIssueKind, GrammarSegment } from "../types.ts";

// Load the Hunspell dictionary as ordinary Vite assets so the worker works in
// a browser without Node's fs.readFile. The upstream `dictionary-en` package
// only exports its JS entry (which uses top-level `await fs.readFile` against
// node:fs), so we vendor the `.aff` / `.dic` data files into the repo and let
// Vite fingerprint + serve them.
import affUrl from "./dictionary-en/index.aff?url";
import dicUrl from "./dictionary-en/index.dic?url";

interface GrammarRequest {
  id: number;
  segments: GrammarSegment[];
}

interface GrammarResponse {
  id: number;
  issues: GrammarIssue[];
  wordsChecked: number;
}

/**
 * Acronyms, tech terms, and common resume vocabulary that Hunscript would
 * otherwise flag. Keep this list small — most false positives are proper
 * nouns, which we suppress separately by dropping capitalised hits.
 */
const PERSONAL_DICTIONARY = [
  "API",
  "APIs",
  "SaaS",
  "PaaS",
  "iOS",
  "macOS",
  "Kubernetes",
  "TypeScript",
  "JavaScript",
  "React",
  "Redux",
  "Node.js",
  "GraphQL",
  "Postgres",
  "PostgreSQL",
  "MongoDB",
  "DevOps",
  "MLOps",
  "CI/CD",
  "backend",
  "frontend",
  "fullstack",
  "serverless",
  "microservices",
  "microservice",
  "webhooks",
  "webhook",
  "dataset",
  "datasets",
  "roadmap",
  "roadmaps",
  "onboarding",
  "offboarding",
  "upskilling",
  "reskilling",
  "OKRs",
  "KPIs",
  "NPS",
  "ARR",
  "MRR",
  "GTM",
  "LLM",
  "LLMs",
  "RAG",
  "GPU",
  "GPUs",
];

/**
 * Build the retext processor lazily on first use. We fetch the Hunspell
 * `.aff` and `.dic` files as asset URLs rather than importing dictionary-en
 * directly, because dictionary-en's default export uses top-level await on
 * `node:fs` which Vite externalises for browser builds.
 */
async function buildProcessor() {
  const [affResp, dicResp] = await Promise.all([fetch(affUrl), fetch(dicUrl)]);
  const [affBuf, dicBuf] = await Promise.all([affResp.arrayBuffer(), dicResp.arrayBuffer()]);
  const dictionary = { aff: new Uint8Array(affBuf), dic: new Uint8Array(dicBuf) };
  return unified()
    .use(retextEnglish)
    .use(retextSpell, { dictionary, personal: PERSONAL_DICTIONARY.join("\n") })
    .use(retextRepeatedWords)
    .use(retextPassive)
    .use(retextReadability, { age: 22, threshold: 4 / 7 })
    .use(retextStringify);
}

let processorPromise: ReturnType<typeof buildProcessor> | null = null;
function getProcessor(): ReturnType<typeof buildProcessor> {
  if (!processorPromise) processorPromise = buildProcessor();
  return processorPromise;
}

function classify(source: string | null | undefined): GrammarIssueKind | null {
  switch (source) {
    case "retext-spell":
      return "spelling";
    case "retext-repeated-words":
      return "repeated";
    case "retext-passive":
      return "passive";
    case "retext-readability":
      return "readability";
    default:
      return null;
  }
}

/**
 * Filter out spelling hits on capitalised tokens mid-segment. Resumes are
 * full of proper nouns (names, employers, products) and flagging every one
 * drowns out the real typos. Sentence-initial capitals are harder to
 * distinguish from proper nouns without a POS tagger, so we accept the
 * miss rather than the noise.
 */
function isProperNoun(actual: string): boolean {
  return /^[A-Z]/.test(actual) && !/^[A-Z]+$/.test(actual); // "APIs" stays, "Workday" drops
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

async function analyse(segments: GrammarSegment[]): Promise<{
  issues: GrammarIssue[];
  wordsChecked: number;
}> {
  const processor = await getProcessor();
  const issues: GrammarIssue[] = [];
  let wordsChecked = 0;
  for (const seg of segments) {
    const text = seg.text.trim();
    if (!text) continue;
    wordsChecked += countWords(text);
    const file = await processor.process(text);
    for (const msg of file.messages) {
      const kind = classify(msg.source);
      if (!kind) continue;
      const actual = msg.actual ?? "";
      if (kind === "spelling" && isProperNoun(actual)) continue;
      const suggestions = (msg.expected ?? [])
        .filter((s): s is string => typeof s === "string")
        .slice(0, 3);
      issues.push({
        segmentId: seg.id,
        segmentLabel: seg.label,
        kind,
        actual,
        suggestions,
        reason: msg.reason ?? "",
      });
    }
  }
  return { issues, wordsChecked };
}

self.addEventListener("message", async (event: MessageEvent<GrammarRequest>) => {
  const { id, segments } = event.data;
  try {
    const { issues, wordsChecked } = await analyse(segments);
    const response: GrammarResponse = { id, issues, wordsChecked };
    (self as unknown as Worker).postMessage(response);
  } catch {
    // Worker errors degrade silently — a missing grammar report shouldn't
    // break the rest of the ATS review. The main thread treats the absence
    // of a response as "couldn't score" and hides the dimension.
    const response: GrammarResponse = { id, issues: [], wordsChecked: 0 };
    (self as unknown as Worker).postMessage(response);
  }
});
