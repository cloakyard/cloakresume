import { PAPER_SIZES, type PaperSize } from "../utils/paperSize.ts";
interface Props {
  value: PaperSize;
  onChange: (next: PaperSize) => void;
}
const OPTIONS: PaperSize[] = ["a4", "letter"];
export function PaperSizeToggle({ value, onChange }: Props) {
  return (
    <fieldset data-paper-size-control className="air-segments resume-paper-size">
      <legend className="sr-only">Paper size</legend>
      {OPTIONS.map((opt) => (
        <button key={opt} type="button" aria-pressed={opt === value} onClick={() => onChange(opt)}>
          {PAPER_SIZES[opt].label}
        </button>
      ))}
    </fieldset>
  );
}
