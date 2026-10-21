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
      <p className="resume-section-note">
        <EyeOff aria-hidden="true" />
        <span>
          <strong>100% private.</strong> The JD is processed entirely in your browser — nothing
          leaves your device.
        </span>
      </p>
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
          onClick={(event) => {
            event.currentTarget.focus();
            onAnalyze();
          }}
          className="air-button air-button--primary w-full"
        >
          <Sparkles size={18} strokeWidth={1.6} aria-hidden="true" />
          Analyze keyword coverage
        </button>
      )}
    </div>
  );
}
