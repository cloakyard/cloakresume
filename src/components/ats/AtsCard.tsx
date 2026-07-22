/**
 * Shared ruled-section primitives used by the ATS review panes.
 * The modal is already the containing surface, so panes use ledger rules
 * instead of stacking rounded cards inside a card.
 */

import type { ReactNode } from "react";

export function CardHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-(--line) pb-2.5">
      <h3 className="m-0 text-sm font-semibold tracking-[-0.01em] text-(--ink-1) sm:text-[15px]">
        {title}
      </h3>
      <span className="font-mono text-[10.5px] text-(--ink-5) tracking-[0.02em] tabular-nums whitespace-nowrap">
        {sub}
      </span>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
  /** Force white card chrome on mobile. Default = transparent on mobile, chrome at sm+. */
  boxed?: boolean;
}) {
  return (
    <section className={`min-w-0 border-t border-(--line) pt-3.5 sm:pt-4 ${className}`}>
      {children}
    </section>
  );
}
