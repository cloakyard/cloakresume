/** Open report groups; the dialog supplies the containing surface. */
import type { ReactNode } from "react";

export function CardHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="resume-review-section-heading">
      <h3>{title}</h3>
      <span className="resume-review-meta">{sub}</span>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`resume-review-section ${className}`}>{children}</section>;
}
