/**
 * Compact SVG previews of each resume template.
 *
 * Shown inside the template picker popover so the user sees the
 * structural intent of each layout (sidebar vs full-width, timeline
 * rail, gradient banner, etc.) before committing. The previews use the
 * picked accent colour so switching `primary` instantly reflects.
 */

import type { TemplateId } from "../types.ts";

interface Props {
  templateId: TemplateId;
  accent: string;
  className?: string;
}

export function TemplateThumbnail({ templateId, accent, className = "" }: Props) {
  const common = {
    viewBox: "0 0 120 160",
    className,
    xmlns: "http://www.w3.org/2000/svg",
    role: "img",
    "aria-label": `${templateId} layout preview`,
  };
  const ink = "#94a3b8"; // slate-400 — body lines
  const strong = "#475569"; // slate-600 — emphasised lines

  switch (templateId) {
    case "classic-sidebar":
      return (
        <svg {...common}>
          <rect width="120" height="160" fill="white" stroke="#e2e8f0" />
          <rect x="0" y="0" width="42" height="160" fill={accent} opacity="0.12" />
          <circle cx="21" cy="22" r="9" fill={accent} opacity="0.5" />
          <rect x="8" y="38" width="26" height="3" rx="1.5" fill={strong} />
          <rect x="11" y="45" width="20" height="2" rx="1" fill={accent} />
          <rect x="8" y="58" width="26" height="2" rx="1" fill={ink} />
          <rect x="8" y="64" width="22" height="2" rx="1" fill={ink} />
          <rect x="8" y="70" width="24" height="2" rx="1" fill={ink} />
          <rect x="8" y="88" width="12" height="2" rx="1" fill={accent} />
          <rect x="8" y="94" width="26" height="2" rx="1" fill={ink} />
          <rect x="8" y="100" width="22" height="2" rx="1" fill={ink} />
          <rect x="8" y="116" width="14" height="2" rx="1" fill={accent} />
          <rect x="8" y="122" width="24" height="2" rx="1" fill={ink} />
          <rect x="50" y="14" width="36" height="3" rx="1.5" fill={strong} />
          <rect x="50" y="20" width="14" height="1.5" rx="0.75" fill={accent} />
          <rect x="50" y="32" width="62" height="2" rx="1" fill={ink} />
          <rect x="50" y="37" width="56" height="2" rx="1" fill={ink} />
          <rect x="50" y="42" width="50" height="2" rx="1" fill={ink} />
          <rect x="50" y="56" width="30" height="2.5" rx="1.25" fill={strong} />
          <rect x="50" y="62" width="20" height="2" rx="1" fill={accent} />
          <rect x="50" y="70" width="62" height="1.5" rx="0.75" fill={ink} />
          <rect x="50" y="75" width="58" height="1.5" rx="0.75" fill={ink} />
          <rect x="50" y="80" width="54" height="1.5" rx="0.75" fill={ink} />
          <rect x="50" y="92" width="24" height="2.5" rx="1.25" fill={strong} />
          <rect x="50" y="98" width="18" height="2" rx="1" fill={accent} />
          <rect x="50" y="106" width="60" height="1.5" rx="0.75" fill={ink} />
          <rect x="50" y="111" width="54" height="1.5" rx="0.75" fill={ink} />
        </svg>
      );

    case "modern-minimal":
      return (
        <svg {...common}>
          <rect width="120" height="160" fill="white" stroke="#e2e8f0" />
          <rect x="10" y="14" width="50" height="5" rx="2" fill={strong} />
          <rect x="10" y="22" width="34" height="2" rx="1" fill={accent} />
          <rect x="10" y="30" width="100" height="1" fill={accent} />
          <rect x="10" y="36" width="14" height="2" rx="1" fill={accent} />
          <rect x="10" y="42" width="100" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="47" width="96" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="52" width="90" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="64" width="22" height="2" rx="1" fill={accent} />
          <rect x="10" y="70" width="32" height="1.5" rx="0.75" fill={strong} />
          <rect x="48" y="70" width="62" height="1.5" rx="0.75" fill={ink} />
          <rect x="48" y="75" width="58" height="1.5" rx="0.75" fill={ink} />
          <rect x="48" y="80" width="52" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="92" width="18" height="2" rx="1" fill={accent} />
          <rect x="10" y="98" width="100" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="103" width="96" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="116" width="22" height="2" rx="1" fill={accent} />
          <rect x="10" y="122" width="36" height="1.5" rx="0.75" fill={strong} />
          <rect x="10" y="127" width="100" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="132" width="96" height="1.5" rx="0.75" fill={ink} />
        </svg>
      );

    case "executive-serif":
      return (
        <svg {...common}>
          <rect width="120" height="160" fill="white" stroke="#e2e8f0" />
          <rect x="34" y="16" width="52" height="6" rx="2" fill={strong} />
          <rect x="40" y="26" width="40" height="2" rx="1" fill={accent} />
          <rect x="30" y="34" width="60" height="1" fill={accent} opacity="0.7" />
          <rect x="45" y="42" width="30" height="2" rx="1" fill={strong} />
          <rect x="10" y="54" width="100" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="59" width="98" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="64" width="90" height="1.5" rx="0.75" fill={ink} />
          <rect x="48" y="74" width="24" height="2" rx="1" fill={strong} />
          <line x1="10" y1="76" x2="45" y2="76" stroke={accent} opacity="0.3" strokeWidth="1" />
          <line x1="75" y1="76" x2="110" y2="76" stroke={accent} opacity="0.3" strokeWidth="1" />
          <rect x="10" y="84" width="100" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="89" width="96" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="94" width="92" height="1.5" rx="0.75" fill={ink} />
          <rect x="45" y="108" width="30" height="2" rx="1" fill={strong} />
          <rect x="10" y="118" width="46" height="1.5" rx="0.75" fill={ink} />
          <rect x="64" y="118" width="46" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="124" width="44" height="1.5" rx="0.75" fill={ink} />
          <rect x="64" y="124" width="44" height="1.5" rx="0.75" fill={ink} />
        </svg>
      );

    case "compact-timeline":
      return (
        <svg {...common}>
          <rect width="120" height="160" fill="white" stroke="#e2e8f0" />
          <rect x="10" y="12" width="40" height="4" rx="2" fill={strong} />
          <rect x="10" y="20" width="28" height="2" rx="1" fill={accent} />
          <rect x="10" y="28" width="52" height="1" fill={accent} opacity="0.7" />
          <rect x="10" y="36" width="20" height="2" rx="1" fill={accent} />
          <line x1="12" y1="44" x2="12" y2="140" stroke={accent} opacity="0.3" strokeWidth="1" />
          <circle cx="12" cy="46" r="2" fill={accent} />
          <rect x="18" y="44" width="38" height="1.8" rx="0.9" fill={strong} />
          <rect x="18" y="48" width="30" height="1.3" rx="0.65" fill={accent} />
          <rect x="18" y="53" width="40" height="1.3" rx="0.65" fill={ink} />
          <rect x="18" y="57" width="38" height="1.3" rx="0.65" fill={ink} />
          <circle cx="12" cy="68" r="2" fill={accent} />
          <rect x="18" y="66" width="38" height="1.8" rx="0.9" fill={strong} />
          <rect x="18" y="70" width="30" height="1.3" rx="0.65" fill={accent} />
          <rect x="18" y="75" width="40" height="1.3" rx="0.65" fill={ink} />
          <circle cx="12" cy="88" r="2" fill={accent} />
          <rect x="18" y="86" width="38" height="1.8" rx="0.9" fill={strong} />
          <rect x="18" y="90" width="30" height="1.3" rx="0.65" fill={accent} />
          <rect x="66" y="12" width="18" height="2" rx="1" fill={accent} />
          <rect x="66" y="18" width="44" height="1.3" rx="0.65" fill={ink} />
          <rect x="66" y="22" width="42" height="1.3" rx="0.65" fill={ink} />
          <rect x="66" y="34" width="18" height="2" rx="1" fill={accent} />
          <rect x="66" y="40" width="20" height="4" rx="1" fill={accent} opacity="0.2" />
          <rect x="89" y="40" width="20" height="4" rx="1" fill={accent} opacity="0.2" />
          <rect x="66" y="46" width="20" height="4" rx="1" fill={accent} opacity="0.2" />
          <rect x="66" y="58" width="18" height="2" rx="1" fill={accent} />
          <rect x="66" y="64" width="44" height="1.3" rx="0.65" fill={ink} />
          <rect x="66" y="68" width="42" height="1.3" rx="0.65" fill={ink} />
        </svg>
      );

    case "gradient-header":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="grad-hdr" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={accent} stopOpacity="0.9" />
              <stop offset="1" stopColor={accent} stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <rect width="120" height="160" fill="white" stroke="#e2e8f0" />
          <rect x="0" y="0" width="120" height="42" fill="url(#grad-hdr)" />
          <circle cx="20" cy="21" r="10" fill="white" opacity="0.9" />
          <rect x="36" y="12" width="46" height="5" rx="2" fill="white" />
          <rect x="36" y="21" width="38" height="2" rx="1" fill="white" opacity="0.8" />
          <rect x="36" y="28" width="68" height="1.5" rx="0.75" fill="white" opacity="0.7" />
          <rect x="10" y="52" width="20" height="2" rx="1" fill={accent} />
          <rect x="10" y="58" width="100" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="63" width="96" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="68" width="92" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="80" width="20" height="2" rx="1" fill={accent} />
          <rect x="10" y="86" width="52" height="1.5" rx="0.75" fill={strong} />
          <rect x="66" y="86" width="44" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="91" width="100" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="96" width="96" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="110" width="20" height="2" rx="1" fill={accent} />
          <rect x="10" y="116" width="28" height="6" rx="2" fill={accent} opacity="0.18" />
          <rect x="42" y="116" width="28" height="6" rx="2" fill={accent} opacity="0.18" />
          <rect x="74" y="116" width="28" height="6" rx="2" fill={accent} opacity="0.18" />
          <rect x="10" y="132" width="100" height="1.5" rx="0.75" fill={ink} />
          <rect x="10" y="137" width="90" height="1.5" rx="0.75" fill={ink} />
        </svg>
      );

    case "academic":
      return (
        <svg {...common}>
          <rect width="120" height="160" fill="white" stroke="#e2e8f0" />
          <rect x="36" y="12" width="48" height="4" rx="2" fill={strong} />
          <rect x="44" y="20" width="32" height="2" rx="1" fill={ink} />
          <rect x="10" y="28" width="100" height="0.8" fill={strong} />
          <rect x="10" y="29.5" width="100" height="0.3" fill={strong} />
          <rect x="10" y="38" width="22" height="2" rx="1" fill={strong} />
          <line x1="32" y1="39" x2="108" y2="39" stroke={ink} opacity="0.3" strokeWidth="0.6" />
          <rect x="10" y="46" width="100" height="1.4" rx="0.7" fill={ink} />
          <rect x="10" y="50" width="96" height="1.4" rx="0.7" fill={ink} />
          <rect x="10" y="54" width="92" height="1.4" rx="0.7" fill={ink} />
          <rect x="10" y="64" width="22" height="2" rx="1" fill={strong} />
          <line x1="32" y1="65" x2="108" y2="65" stroke={ink} opacity="0.3" strokeWidth="0.6" />
          <rect x="10" y="72" width="48" height="1.6" rx="0.8" fill={strong} />
          <rect x="76" y="72" width="30" height="1.6" rx="0.8" fill={ink} />
          <rect x="10" y="77" width="40" height="1.4" rx="0.7" fill={accent} />
          <rect x="10" y="86" width="48" height="1.6" rx="0.8" fill={strong} />
          <rect x="76" y="86" width="30" height="1.6" rx="0.8" fill={ink} />
          <rect x="10" y="91" width="40" height="1.4" rx="0.7" fill={accent} />
          <rect x="10" y="102" width="22" height="2" rx="1" fill={strong} />
          <line x1="32" y1="103" x2="108" y2="103" stroke={ink} opacity="0.3" strokeWidth="0.6" />
          <rect x="10" y="110" width="100" height="1.4" rx="0.7" fill={ink} />
          <rect x="10" y="114" width="96" height="1.4" rx="0.7" fill={ink} />
          <rect x="10" y="124" width="22" height="2" rx="1" fill={strong} />
          <line x1="32" y1="125" x2="108" y2="125" stroke={ink} opacity="0.3" strokeWidth="0.6" />
          <rect x="10" y="132" width="48" height="1.4" rx="0.7" fill={ink} />
          <rect x="62" y="132" width="48" height="1.4" rx="0.7" fill={ink} />
          <rect x="10" y="137" width="44" height="1.4" rx="0.7" fill={ink} />
          <rect x="62" y="137" width="46" height="1.4" rx="0.7" fill={ink} />
        </svg>
      );

    case "ats-plain":
      return (
        <svg {...common}>
          <rect width="120" height="160" fill="white" stroke="#e2e8f0" />
          <rect x="10" y="12" width="60" height="4.5" rx="1" fill="#0b1220" />
          <rect x="10" y="21" width="40" height="2" rx="1" fill="#0b1220" />
          <rect x="10" y="27" width="80" height="1.4" rx="0.7" fill="#111827" />
          <line x1="10" y1="33" x2="110" y2="33" stroke="#000" strokeWidth="0.8" />
          <rect x="10" y="40" width="22" height="2.2" rx="1" fill="#000" />
          <line x1="10" y1="44" x2="110" y2="44" stroke="#000" strokeWidth="0.6" />
          <rect x="10" y="49" width="100" height="1.4" rx="0.7" fill="#111827" />
          <rect x="10" y="53" width="96" height="1.4" rx="0.7" fill="#111827" />
          <rect x="10" y="57" width="92" height="1.4" rx="0.7" fill="#111827" />
          <rect x="10" y="66" width="22" height="2.2" rx="1" fill="#000" />
          <line x1="10" y1="70" x2="110" y2="70" stroke="#000" strokeWidth="0.6" />
          <rect x="10" y="75" width="56" height="1.6" rx="0.8" fill="#000" />
          <rect x="82" y="75" width="26" height="1.6" rx="0.8" fill="#374151" />
          <rect x="13" y="80" width="94" height="1.3" rx="0.65" fill="#111827" />
          <rect x="13" y="84" width="90" height="1.3" rx="0.65" fill="#111827" />
          <rect x="13" y="88" width="86" height="1.3" rx="0.65" fill="#111827" />
          <rect x="10" y="97" width="56" height="1.6" rx="0.8" fill="#000" />
          <rect x="82" y="97" width="26" height="1.6" rx="0.8" fill="#374151" />
          <rect x="13" y="102" width="94" height="1.3" rx="0.65" fill="#111827" />
          <rect x="13" y="106" width="90" height="1.3" rx="0.65" fill="#111827" />
          <rect x="10" y="116" width="22" height="2.2" rx="1" fill="#000" />
          <line x1="10" y1="120" x2="110" y2="120" stroke="#000" strokeWidth="0.6" />
          <rect x="10" y="125" width="60" height="1.4" rx="0.7" fill="#111827" />
          <rect x="10" y="130" width="56" height="1.4" rx="0.7" fill="#111827" />
          <rect x="10" y="140" width="22" height="2.2" rx="1" fill="#000" />
          <line x1="10" y1="144" x2="110" y2="144" stroke="#000" strokeWidth="0.6" />
          <rect x="10" y="149" width="92" height="1.4" rx="0.7" fill="#111827" />
        </svg>
      );

    case "ats-professional":
      return (
        <svg {...common}>
          <rect width="120" height="160" fill="white" stroke="#e2e8f0" />
          <rect x="10" y="14" width="64" height="5" rx="2" fill={strong} />
          <rect x="10" y="22" width="42" height="2" rx="1" fill={accent} />
          <rect x="10" y="28" width="92" height="1.4" rx="0.7" fill={ink} />
          <rect x="10" y="34" width="100" height="1.6" fill={accent} />
          <rect x="10" y="41" width="34" height="2.2" rx="1" fill={accent} />
          <line x1="10" y1="45" x2="110" y2="45" stroke={accent} opacity="0.4" strokeWidth="0.6" />
          <rect x="10" y="50" width="100" height="1.4" rx="0.7" fill={ink} />
          <rect x="10" y="54" width="96" height="1.4" rx="0.7" fill={ink} />
          <rect x="10" y="58" width="92" height="1.4" rx="0.7" fill={ink} />
          <rect x="10" y="66" width="26" height="2.2" rx="1" fill={accent} />
          <line x1="10" y1="70" x2="110" y2="70" stroke={accent} opacity="0.4" strokeWidth="0.6" />
          <rect x="10" y="75" width="56" height="1.6" rx="0.8" fill={strong} />
          <rect x="82" y="75" width="26" height="1.6" rx="0.8" fill={ink} />
          <rect x="10" y="80" width="40" height="1.4" rx="0.7" fill={accent} />
          <rect x="13" y="86" width="94" height="1.3" rx="0.65" fill={ink} />
          <rect x="13" y="90" width="90" height="1.3" rx="0.65" fill={ink} />
          <rect x="13" y="94" width="86" height="1.3" rx="0.65" fill={ink} />
          <rect x="10" y="104" width="56" height="1.6" rx="0.8" fill={strong} />
          <rect x="82" y="104" width="26" height="1.6" rx="0.8" fill={ink} />
          <rect x="10" y="109" width="40" height="1.4" rx="0.7" fill={accent} />
          <rect x="13" y="115" width="94" height="1.3" rx="0.65" fill={ink} />
          <rect x="13" y="119" width="88" height="1.3" rx="0.65" fill={ink} />
          <rect x="10" y="128" width="30" height="2.2" rx="1" fill={accent} />
          <line
            x1="10"
            y1="132"
            x2="110"
            y2="132"
            stroke={accent}
            opacity="0.4"
            strokeWidth="0.6"
          />
          <rect x="10" y="138" width="100" height="1.4" rx="0.7" fill={ink} />
          <rect x="10" y="143" width="88" height="1.4" rx="0.7" fill={ink} />
          <rect x="10" y="148" width="78" height="1.4" rx="0.7" fill={ink} />
        </svg>
      );

    default:
      return null;
  }
}
