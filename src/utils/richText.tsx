/**
 * Markdown-lite renderer for resume body text.
 *
 * Supports **bold**, __bold__, *italic*, _italic_, and `code` — the
 * minimum needed for emphasising keywords or titles inside otherwise
 * plain text fields. Renders to React nodes (no dangerouslySetInnerHTML),
 * so templates stay XSS-safe.
 */

import type { ReactNode } from "react";

type Token =
  | { type: "text"; value: string }
  | { type: "bold"; children: Token[] }
  | { type: "italic"; children: Token[] }
  | { type: "code"; value: string };

const MARKER_RE = /(\*\*|__|\*|_|`)/;

function parseInline(input: string): Token[] {
  const out: Token[] = [];
  let remaining = input;
  while (remaining.length > 0) {
    const match = MARKER_RE.exec(remaining);
    if (!match) {
      out.push({ type: "text", value: remaining });
      break;
    }
    if (match.index > 0) {
      out.push({ type: "text", value: remaining.slice(0, match.index) });
    }
    const marker = match[0];
    const rest = remaining.slice(match.index + marker.length);
    const closeIdx = findClose(rest, marker);
    if (closeIdx === -1) {
      // No matching close — treat as literal.
      out.push({ type: "text", value: marker });
      remaining = rest;
      continue;
    }
    const inner = rest.slice(0, closeIdx);
    remaining = rest.slice(closeIdx + marker.length);
    if (marker === "**" || marker === "__") {
      out.push({ type: "bold", children: parseInline(inner) });
    } else if (marker === "*" || marker === "_") {
      out.push({ type: "italic", children: parseInline(inner) });
    } else if (marker === "`") {
      out.push({ type: "code", value: inner });
    }
  }
  return out;
}

function findClose(s: string, marker: string): number {
  // Look for the next occurrence of the same marker that isn't stuck to the opening.
  let i = 0;
  while (i < s.length) {
    const idx = s.indexOf(marker, i);
    if (idx === -1) return -1;
    // Ensure we don't match a different-length marker as a prefix (e.g. `*` inside `**`).
    if (marker === "*" && s[idx + 1] === "*") {
      i = idx + 2;
      continue;
    }
    if (marker === "_" && s[idx + 1] === "_") {
      i = idx + 2;
      continue;
    }
    return idx;
  }
  return -1;
}

function renderTokens(tokens: Token[], keyPrefix = ""): ReactNode[] {
  return tokens.map((t, i) => {
    const key = `${keyPrefix}${i}`;
    if (t.type === "text") return <span key={key}>{t.value}</span>;
    if (t.type === "bold") return <strong key={key}>{renderTokens(t.children, `${key}.`)}</strong>;
    if (t.type === "italic") return <em key={key}>{renderTokens(t.children, `${key}.`)}</em>;
    return (
      <code
        key={key}
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "0.9em",
          background: "rgba(0,0,0,0.04)",
          padding: "0 0.3em",
          borderRadius: "2px",
        }}
      >
        {t.value}
      </code>
    );
  });
}

/** Render plain text with Markdown-lite inline formatting. */
export function RichText({ value, block = false }: { value: string; block?: boolean }) {
  if (!value) return null;
  const lines = value.split(/\r?\n/);
  const rendered = lines.map((line, i) => (
    <span key={i}>
      {renderTokens(parseInline(line))}
      {i < lines.length - 1 && block && <br />}
    </span>
  ));
  return <>{rendered}</>;
}

/**
 * Wrap the currently-selected range in a textarea with the given marker.
 * Returns the updated value and the new selection positions.
 */
export function wrapSelection(
  textarea: HTMLTextAreaElement,
  marker: string,
): { value: string; start: number; end: number } {
  const { selectionStart, selectionEnd, value } = textarea;
  const before = value.slice(0, selectionStart);
  const selected = value.slice(selectionStart, selectionEnd);
  const after = value.slice(selectionEnd);
  const next = `${before}${marker}${selected || "text"}${marker}${after}`;
  const innerStart = before.length + marker.length;
  const innerEnd = innerStart + (selected.length || 4);
  return { value: next, start: innerStart, end: innerEnd };
}

/**
 * Toggle the given marker around the current selection. If the selection
 * is already wrapped (markers immediately outside, immediately inside, or
 * a collapsed cursor sitting within a matched pair on the same line) the
 * markers are removed; otherwise the selection is wrapped.
 *
 * Returns the updated value plus the new selection positions so the
 * caller can restore the caret / selection after applying the change.
 */
export function toggleSelection(
  textarea: HTMLTextAreaElement,
  marker: string,
): { value: string; start: number; end: number } {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const m = marker.length;

  // Markers sit immediately outside the selection: **[foo]**
  if (
    s >= m &&
    e + m <= value.length &&
    value.slice(s - m, s) === marker &&
    value.slice(e, e + m) === marker
  ) {
    const next = value.slice(0, s - m) + value.slice(s, e) + value.slice(e + m);
    return { value: next, start: s - m, end: e - m };
  }

  // Markers sit just inside the selection: [**foo**]
  if (e - s >= 2 * m && value.slice(s, s + m) === marker && value.slice(e - m, e) === marker) {
    const next = value.slice(0, s) + value.slice(s + m, e - m) + value.slice(e);
    return { value: next, start: s, end: e - 2 * m };
  }

  // Collapsed cursor inside a matched pair on the same line — unwrap it.
  if (s === e) {
    const enclosing = findEnclosingPair(value, s, marker);
    if (enclosing) {
      const { open, close } = enclosing;
      const next = value.slice(0, open) + value.slice(open + m, close) + value.slice(close + m);
      // Clamp the caret to the new (unwrapped) region.
      const caret = Math.max(open, Math.min(s - m, close - m));
      return { value: next, start: caret, end: caret };
    }
  }

  // Default: wrap the selection (or insert placeholder when empty).
  const selected = value.slice(s, e);
  const placeholder = "text";
  const inner = selected || placeholder;
  const next = `${value.slice(0, s)}${marker}${inner}${marker}${value.slice(e)}`;
  const innerStart = s + m;
  const innerEnd = innerStart + inner.length;
  return { value: next, start: innerStart, end: innerEnd };
}

/**
 * Compute which inline markers are "open" at the given cursor position.
 * Scoped to the current line since our grammar doesn't span newlines.
 *
 * Uses a simple toggle-on-encounter scan — longer markers (`**`, `__`)
 * are matched before single-character ones so `*` inside `**…**` isn't
 * mistaken for italic start/end.
 */
export function formatStateAt(
  value: string,
  pos: number,
): { bold: boolean; italic: boolean; code: boolean } {
  const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
  const end = Math.min(pos, value.length);
  let boldStar = false;
  let boldUnder = false;
  let italicStar = false;
  let italicUnder = false;
  let code = false;
  let i = lineStart;
  while (i < end) {
    // Inside a code span the other markers are literal — ignore them.
    if (code) {
      if (value[i] === "`") {
        code = false;
        i += 1;
      } else {
        i += 1;
      }
      continue;
    }
    if (value.slice(i, i + 2) === "**") {
      boldStar = !boldStar;
      i += 2;
    } else if (value.slice(i, i + 2) === "__") {
      boldUnder = !boldUnder;
      i += 2;
    } else if (value[i] === "*") {
      italicStar = !italicStar;
      i += 1;
    } else if (value[i] === "_") {
      italicUnder = !italicUnder;
      i += 1;
    } else if (value[i] === "`") {
      code = true;
      i += 1;
    } else {
      i += 1;
    }
  }
  return {
    bold: boldStar || boldUnder,
    italic: italicStar || italicUnder,
    code,
  };
}

/**
 * Scan the current line for a matched marker pair that encloses `pos`.
 * Returns the absolute indices of the opening and closing markers, or
 * null if `pos` isn't inside such a pair.
 */
function findEnclosingPair(
  value: string,
  pos: number,
  marker: string,
): { open: number; close: number } | null {
  const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
  const nextNl = value.indexOf("\n", pos);
  const lineEnd = nextNl === -1 ? value.length : nextNl;
  const m = marker.length;

  // Collect marker positions on this line while respecting longer variants.
  const positions: number[] = [];
  let i = lineStart;
  while (i < lineEnd) {
    if (marker === "*" && value.slice(i, i + 2) === "**") {
      i += 2;
      continue;
    }
    if (marker === "_" && value.slice(i, i + 2) === "__") {
      i += 2;
      continue;
    }
    if (value.slice(i, i + m) === marker) {
      positions.push(i);
      i += m;
    } else {
      i += 1;
    }
  }

  for (let k = 0; k + 1 < positions.length; k += 2) {
    const open = positions[k];
    const close = positions[k + 1];
    if (pos >= open + m && pos <= close) {
      return { open, close };
    }
  }
  return null;
}
