/** Shared primary-colour body. Only deliberate edits change the stored colour. */
import { Check } from "lucide-react";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { hexToHsv, hsvToHex, wheelPosition, wheelValue } from "../../docs/air/colour.mjs";
import { normalizePrimaryColor, PRESET_COLORS } from "../utils/colors.ts";

type HSV = ReturnType<typeof hexToHsv>;
const validHex = (value: string) => /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value);

export function ColorPickerContent({
  primary,
  onChange,
  brightnessRef,
}: {
  primary: string;
  onChange: (hex: string) => void;
  brightnessRef: RefObject<HTMLInputElement | null>;
}) {
  const id = useId();
  const [hsv, setHsv] = useState(() => hexToHsv(normalizePrimaryColor(primary)));
  const [hexDraft, setHexDraft] = useState(primary);
  const [touched, setTouched] = useState(false);
  const lastValue = useRef(primary);
  const gesture = useRef<{ id: number; hsv: HSV; hex: string } | null>(null);

  useEffect(() => {
    if (primary === lastValue.current) return;
    lastValue.current = primary;
    setHsv(hexToHsv(normalizePrimaryColor(primary)));
    setHexDraft(primary);
    setTouched(false);
    gesture.current = null;
  }, [primary]);

  const commit = (next: HSV, hex = hsvToHex(next.h, next.s, next.v)) => {
    lastValue.current = hex;
    setHsv(next);
    setHexDraft(hex);
    setTouched(false);
    onChange(hex);
  };
  const chooseHex = (hex: string) => {
    const next = hexToHsv(normalizePrimaryColor(hex));
    // An achromatic value has no hue; retain that choice for subsequent edits.
    if (next.s === 0) next.h = hsv.h;
    if (next.v === 0) next.s = hsv.s;
    commit(next, hex);
  };
  const applyPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const next = wheelValue(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
      hsv.h,
    );
    commit({ ...next, v: hsv.v || 1 });
  };
  const cancelPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (start?.id !== event.pointerId) return;
    gesture.current = null;
    commit(start.hsv, start.hex);
  };
  const point = wheelPosition(hsv.h, hsv.s);
  const invalid = touched && !validHex(hexDraft);

  return (
    <div className="resume-colour-content">
      <div role="group" aria-labelledby={`${id}-presets`}>
        <span id={`${id}-presets`} className="air-label">
          Presets
        </span>
        <div className="resume-colour-presets">
          {PRESET_COLORS.map((preset) => (
            <button
              type="button"
              key={preset.value}
              className="air-icon-button air-button--quiet"
              aria-label={`Set primary colour to ${preset.name}`}
              title={preset.name}
              aria-pressed={preset.value.toLowerCase() === primary.toLowerCase()}
              onClick={() => chooseHex(preset.value)}
            >
              <span className="resume-colour-swatch" style={{ background: preset.value }}>
                {preset.value.toLowerCase() === primary.toLowerCase() && (
                  <Check aria-hidden="true" style={{ color: "#fff" }} />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div
        className="air-colour-wheel"
        role="group"
        tabIndex={0}
        aria-label="Hue and saturation wheel"
        aria-describedby={`${id}-wheel-help`}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 10 : 1;
          let { h, s } = hsv;
          switch (event.key) {
            case "ArrowLeft":
              h = (h - step + 360) % 360;
              break;
            case "ArrowRight":
              h = (h + step) % 360;
              break;
            case "ArrowUp":
              s = Math.min(1, s + step / 100);
              break;
            case "ArrowDown":
              s = Math.max(0, s - step / 100);
              break;
            case "Home":
              h = 0;
              break;
            case "End":
              h = 359;
              break;
            default:
              return;
          }
          event.preventDefault();
          commit({ h, s, v: hsv.v || 1 });
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0 || gesture.current) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          gesture.current = { id: event.pointerId, hsv, hex: primary };
          applyPointer(event);
        }}
        onPointerMove={(event) => {
          if (gesture.current?.id === event.pointerId) applyPointer(event);
        }}
        onPointerUp={(event) => {
          if (gesture.current?.id === event.pointerId) gesture.current = null;
        }}
        onPointerCancel={cancelPointer}
        onLostPointerCapture={cancelPointer}
      >
        <span
          className="air-colour-wheel__point"
          style={{ left: `${point.x}%`, top: `${point.y}%`, background: primary }}
        />
      </div>
      <p id={`${id}-wheel-help`} className="sr-only">
        Left and right change hue; up and down change saturation. Hold Shift for larger steps. Home
        and End select the first and last hue. Separate sliders are available in Fine tune hue &amp;
        saturation.
      </p>
      <div>
        <label className="air-label resume-colour-range-label" htmlFor={`${id}-brightness`}>
          Brightness <output>{Math.round(hsv.v * 100)}%</output>
        </label>
        <input
          ref={brightnessRef}
          id={`${id}-brightness`}
          name="resume-primary-brightness"
          type="range"
          min="0"
          max="100"
          value={Math.round(hsv.v * 100)}
          aria-valuetext={`${Math.round(hsv.v * 100)} percent`}
          className="air-colour-brightness"
          style={{
            backgroundImage: `linear-gradient(to right, #000, ${hsvToHex(hsv.h, hsv.s, 1)})`,
          }}
          onChange={(event) => commit({ ...hsv, v: Number(event.target.value) / 100 })}
        />
      </div>
      <div>
        <label className="air-label" htmlFor={`${id}-hex`}>
          Hex colour value
        </label>
        <input
          id={`${id}-hex`}
          name="resume-primary-hex"
          autoComplete="off"
          spellCheck={false}
          type="text"
          className="air-field"
          value={hexDraft}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(event) => {
            const value = event.target.value;
            setHexDraft(value);
            if (validHex(value)) chooseHex(value);
          }}
          onBlur={() => setTouched(true)}
        />
        {invalid && (
          <p id={`${id}-error`} className="air-help air-help--error" role="status">
            Enter a hex colour such as #047857 or #abc.
          </p>
        )}
      </div>
      <details className="resume-colour-fine">
        <summary>Fine tune hue &amp; saturation</summary>
        <label className="air-label resume-colour-range-label" htmlFor={`${id}-hue`}>
          Hue <output>{Math.round(hsv.h)}°</output>
        </label>
        <input
          id={`${id}-hue`}
          name="resume-primary-hue"
          type="range"
          min="0"
          max="360"
          value={Math.round(hsv.h)}
          aria-valuetext={`${Math.round(hsv.h)} degrees`}
          onChange={(event) => commit({ ...hsv, h: Number(event.target.value) })}
        />
        <label className="air-label resume-colour-range-label" htmlFor={`${id}-saturation`}>
          Saturation <output>{Math.round(hsv.s * 100)}%</output>
        </label>
        <input
          id={`${id}-saturation`}
          name="resume-primary-saturation"
          type="range"
          min="0"
          max="100"
          value={Math.round(hsv.s * 100)}
          aria-valuetext={`${Math.round(hsv.s * 100)} percent`}
          onChange={(event) => commit({ ...hsv, s: Number(event.target.value) / 100 })}
        />
      </details>
    </div>
  );
}
