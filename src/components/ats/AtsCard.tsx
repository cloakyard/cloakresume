/**
 * Shared card primitives used by the ATS review panes.
 *
 * By default, on mobile the cards render as transparent sections (content
 * flows directly into the scroll body); sm+ adds the white card chrome so
 * each pane reads as an individual surface. Pass `boxed` to force the
 * chrome on mobile too — useful when the card content (scorecards,
 * stat grids) needs visual containment even on small screens.
 * Kept together because `CardHead` is only ever placed inside a `Card`.
 */

import type { ReactNode } from "react";

export function CardHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 mb-2 pb-1.5 border-b border-(--line-soft) sm:mb-3.5 sm:pb-2.5">
      <h3 className="m-0 text-[13px] font-semibold text-(--ink-1) tracking-[-0.005em] sm:text-[15px]">
        {title}
      </h3>
      <span className="font-mono text-[10px] text-(--ink-5) tracking-[0.02em] whitespace-nowrap">
        {sub}
      </span>
    </div>
  );
}

export function Card({
  children,
  className = "",
  boxed = false,
}: {
  children: ReactNode;
  className?: string;
  /** Force white card chrome on mobile. Default = transparent on mobile, chrome at sm+. */
  boxed?: boolean;
}) {
  const mobileChrome = boxed ? "bg-white border border-(--line) rounded-xl p-3.5" : "";
  return (
    <section
      className={`min-w-0 ${mobileChrome} sm:bg-white sm:border sm:border-(--line) sm:rounded-xl sm:shadow-(--sh-xs) sm:p-4 min-[900px]:p-5 ${className}`}
    >
      {children}
    </section>
  );
}
