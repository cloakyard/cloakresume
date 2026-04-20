/** Target JD: privacy notice + textarea + analyze CTA. */

import { EyeOff, Sparkles } from "lucide-react";

interface Props {
  jobDescription: string;
  onJobDescriptionChange: (v: string) => void;
  onAnalyze?: () => void;
}

export function JdSection({ jobDescription, onJobDescriptionChange, onAnalyze }: Props) {
  return (
    <div className="cr-stack">
      <div className="flex gap-2.5 p-3.5 rounded-md text-[12.5px] leading-snug bg-(--brand-50) border border-(--brand-200) text-(--ink-2)">
        <EyeOff className="w-4 h-4 shrink-0 mt-0.5 text-(--brand-700)" />
        <div>
          <strong className="text-(--ink-1)">100% private.</strong> The JD is processed entirely in
          your browser — nothing leaves your device.
        </div>
      </div>
      <label className="cr-field">
        <span className="cr-field-label">Paste target job description</span>
        <textarea
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          rows={12}
          placeholder="Paste the JD here to see keyword coverage and ATS match on the preview…"
          className="cr-input resize-y"
        />
      </label>
      {onAnalyze && (
        <button type="button" onClick={onAnalyze} className="tb primary w-full justify-center">
          <Sparkles className="w-4 h-4" />
          Analyze keyword coverage
        </button>
      )}
    </div>
  );
}
