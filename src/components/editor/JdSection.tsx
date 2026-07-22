/** Target JD: privacy notice + textarea + analyze CTA. */

import { EyeOff, Sparkles } from "lucide-react";
import { TextArea } from "../fields.tsx";

interface Props {
  jobDescription: string;
  onJobDescriptionChange: (v: string) => void;
  onAnalyze?: () => void;
}

export function JdSection({ jobDescription, onJobDescriptionChange, onAnalyze }: Props) {
  return (
    <div className="cr-stack">
      <div className="flex gap-2.5 rounded-md border border-(--brand-200) bg-(--brand-50) p-3.5 text-sm leading-[1.5] text-(--ink-2)">
        <EyeOff className="w-4 h-4 shrink-0 mt-0.5 text-(--brand-700)" />
        <div>
          <strong className="text-(--ink-1)">100% private.</strong> The JD is processed entirely in
          your browser — nothing leaves your device.
        </div>
      </div>
      <TextArea
        label="Paste target job description"
        name="target-job-description"
        value={jobDescription}
        onChange={onJobDescriptionChange}
        rows={12}
        placeholder="Paste the JD here to see keyword coverage and ATS match on the preview…"
      />
      {onAnalyze && (
        <button
          type="button"
          onClick={onAnalyze}
          className="tb primary w-full min-h-11 md:min-h-10 justify-center"
        >
          <Sparkles className="w-4 h-4" />
          Analyze keyword coverage
        </button>
      )}
    </div>
  );
}
