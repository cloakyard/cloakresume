/**
 * Markdown-lite renderer for resume body text.
 *
 * Supports **bold**, __bold__, *italic*, _italic_, <u>underline</u>, and `code` — the
 * minimum needed for emphasising keywords or titles inside otherwise
 * plain text fields. Renders to React nodes (no dangerouslySetInnerHTML),
 * so templates stay XSS-safe.
 */

import type { ReactNode } from "react";

type Token =
  | { type: "text"; value: string }
  | { type: "bold"; children: Token[] }
  | { type: "italic"; children: Token[] }
  | { type: "underline"; children: Token[] }
  | { type: "code"; value: string };

const MARKER_RE = /(\*\*|__|\*|_|`|<u>)/;

function closingMarker(marker: string): string {
  return marker === "<u>" ? "</u>" : marker;
}

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
    // Underscores inside identifiers (e.g. event_source_id) are literal text.
    if (
      marker.startsWith("_") &&
      /[\p{L}\p{N}]/u.test(remaining[match.index - 1] ?? "") &&
      /[\p{L}\p{N}]/u.test(rest[0] ?? "")
    ) {
      out.push({ type: "text", value: marker });
      remaining = rest;
      continue;
    }
    const close = closingMarker(marker);
    const closeIdx = findClose(rest, close);
    if (closeIdx === -1) {
      // No matching close — treat as literal.
      out.push({ type: "text", value: marker });
      remaining = rest;
      continue;
    }
    const inner = rest.slice(0, closeIdx);
    remaining = rest.slice(closeIdx + close.length);
    if (marker === "**" || marker === "__") {
      out.push({ type: "bold", children: parseInline(inner) });
    } else if (marker === "*" || marker === "_") {
      out.push({ type: "italic", children: parseInline(inner) });
    } else if (marker === "`") {
      out.push({ type: "code", value: inner });
    } else if (marker === "<u>") {
      out.push({ type: "underline", children: parseInline(inner) });
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
    if (t.type === "underline")
      return (
        <u key={key} style={{ textDecorationLine: "underline", textUnderlineOffset: "0.12em" }}>
          {renderTokens(t.children, `${key}.`)}
        </u>
      );
    return (
      <code
        key={key}
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "0.9em",
          background: "rgba(0,0,0,0.04)",
          padding: "0 0.3em",
          borderRadius: "2px",
          overflowWrap: "anywhere",
        }}
      >
        {t.value}
      </code>
    );
  });
}

/** Render body text with inline formatting, preserving entered whitespace and line breaks. */
export function RichText({ value }: { value: string }) {
  if (!value) return null;
  const lines = value.split(/\r\n|\r|\n/);
  const rendered = lines.map((line, i) => (
    <span key={i}>
      {renderTokens(parseInline(line))}
      {i < lines.length - 1 && <br />}
    </span>
  ));
  return <span style={{ whiteSpace: "pre-wrap" }}>{rendered}</span>;
}

/** Use the same inline grammar for analysis and the displayed résumé. */
export function plainText(value: string): string {
  const flatten = (tokens: Token[]): string =>
    tokens
      .map((token) =>
        token.type === "text" || token.type === "code" ? token.value : flatten(token.children),
      )
      .join("");
  return value
    .split(/\r\n|\r|\n/)
    .map((line) => flatten(parseInline(line)))
    .join("\n");
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
  textarea: Pick<HTMLTextAreaElement, "value" | "selectionStart" | "selectionEnd">,
  marker: string,
): { value: string; start: number; end: number } {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const m = marker.length;
  const closeMarker = closingMarker(marker);
  const c = closeMarker.length;

  // Inline formatting is scoped to a line. Wrap each selected line separately,
  // leaving blank lines and indentation intact so toolbar actions match preview.
  const selected = value.slice(s, e);
  if (/[\r\n]/.test(selected)) {
    const inner = selected
      .split(/(\r\n|\r|\n)/)
      .map((line) => {
        if (!line.trim()) return line;
        const start = line.length - line.trimStart().length;
        const end = line.trimEnd().length;
        return toggleSelection({ value: line, selectionStart: start, selectionEnd: end }, marker)
          .value;
      })
      .join("");
    return { value: value.slice(0, s) + inner + value.slice(e), start: s, end: s + inner.length };
  }

  // Markers sit immediately outside the selection: **[foo]**
  if (
    s >= m &&
    e + c <= value.length &&
    value.slice(s - m, s) === marker &&
    value.slice(e, e + c) === closeMarker
  ) {
    const next = value.slice(0, s - m) + value.slice(s, e) + value.slice(e + c);
    return { value: next, start: s - m, end: e - m };
  }

  // Markers sit just inside the selection: [**foo**]
  if (e - s >= m + c && value.slice(s, s + m) === marker && value.slice(e - c, e) === closeMarker) {
    const next = value.slice(0, s) + value.slice(s + m, e - c) + value.slice(e);
    return { value: next, start: s, end: e - m - c };
  }

  // Collapsed cursor inside a matched pair on the same line — unwrap it.
  if (s === e) {
    const enclosing = findEnclosingPair(value, s, marker);
    if (enclosing) {
      const { open, close } = enclosing;
      const next = value.slice(0, open) + value.slice(open + m, close) + value.slice(close + c);
      // Clamp the caret to the new (unwrapped) region.
      const caret = Math.max(open, Math.min(s - m, close - m));
      return { value: next, start: caret, end: caret };
    }
  }

  // Default: wrap the selection (or insert placeholder when empty).
  const placeholder = "text";
  const inner = selected || placeholder;
  const next = `${value.slice(0, s)}${marker}${inner}${closeMarker}${value.slice(e)}`;
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
  selectionEnd = pos,
): { bold: boolean; italic: boolean; underline: boolean; code: boolean } {
  // A multiline toolbar action selects the markers too. Inspect the first
  // selected character after opening markers so the chosen format stays active.
  if (selectionEnd > pos) {
    pos += value.slice(pos, selectionEnd).match(/^\s*(?:(?:\*\*|__|\*|_|`|<u>))*/)?.[0].length ?? 0;
  }
  const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
  const end = Math.min(pos, value.length);
  let boldStar = false;
  let boldUnder = false;
  let italicStar = false;
  let italicUnder = false;
  let code = false;
  let underline = false;
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
    if (value.startsWith("<u>", i)) {
      underline = true;
      i += 3;
    } else if (value.startsWith("</u>", i)) {
      underline = false;
      i += 4;
    } else if (value.slice(i, i + 2) === "**") {
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
    underline,
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

  if (marker === "<u>") {
    const pattern = /<u>|<\/u>/g;
    pattern.lastIndex = lineStart;
    let open: number | null = null;
    for (
      let match = pattern.exec(value);
      match && match.index < lineEnd;
      match = pattern.exec(value)
    ) {
      if (match[0] === "<u>") open = match.index;
      else if (open !== null) {
        if (pos >= open + m && pos <= match.index) return { open, close: match.index };
        open = null;
      }
    }
    return null;
  }

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
