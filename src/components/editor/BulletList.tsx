/** UI-only identities keep duplicate string bullets attached to their editor state. */
import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { DragItem, DragList } from "../DragList.tsx";
import { FormatToolbar } from "../FormatScope.tsx";
import { RichTextArea } from "../RichTextArea.tsx";

export function BulletList({
  values,
  onChange,
  fieldPrefix,
  ariaLabel,
  itemLabel,
  label = "Bullets",
  emptyText = "Add a bullet to describe your work.",
}: {
  values: string[];
  onChange: (next: string[]) => void;
  fieldPrefix: string;
  ariaLabel: string;
  itemLabel: string;
  label?: string;
  emptyText?: string;
}) {
  const nextId = useRef(values.length);
  const [keys, setKeys] = useState(() => values.map((_, i) => i));
  const root = useRef<HTMLDivElement>(null);
  // Imported/replaced values can change the count independently of these actions.
  if (keys.length !== values.length) setKeys(values.map((_, i) => keys[i] ?? nextId.current++));
  const rows = values.map((text, i) => ({ id: keys[i], text }));
  return (
    <div ref={root} className="cr-field">
      <div className="cr-field-row">
        <span className="air-label">{label}</span>
        <div className="resume-writing-actions">
          <FormatToolbar />
          <button
            type="button"
            className="air-button air-button--quiet resume-add-bullet"
            aria-label={`Add bullet to ${itemLabel}`}
            onClick={() => {
              setKeys([...keys, nextId.current++]);
              onChange([...values, ""]);
              requestAnimationFrame(() => {
                const fields = root.current?.querySelectorAll<HTMLTextAreaElement>("textarea");
                const field = fields?.[fields.length - 1];
                field?.focus({ preventScroll: true });
                field?.scrollIntoView({ block: "nearest" });
              });
            }}
          >
            <Plus size={18} strokeWidth={1.6} aria-hidden="true" />
            Bullet
          </button>
        </div>
      </div>
      {values.length === 0 ? (
        <p className="air-help">{emptyText}</p>
      ) : (
        <DragList
          className="resume-bullet-list"
          items={rows}
          onReorder={(next) => {
            setKeys(next.map((row) => row.id));
            onChange(next.map((row) => row.text));
          }}
        >
          {rows.map((row, i) => (
            <DragItem
              key={row.id}
              index={i}
              label={`${itemLabel}, bullet ${i + 1}`}
              onDelete={() => {
                setKeys(keys.filter((_, j) => j !== i));
                onChange(values.filter((_, j) => j !== i));
              }}
            >
              {(handle, remove, move) => (
                <div className="resume-bullet-entry">
                  <div className="resume-entry-heading">
                    <span className="air-label">Bullet {i + 1}</span>
                    <div className="resume-entry-actions">
                      {handle}
                      {move}
                      {remove}
                    </div>
                  </div>
                  <RichTextArea
                    ariaLabel={`${ariaLabel} ${i + 1}`}
                    fieldId={`${fieldPrefix}.${i}`}
                    value={row.text}
                    rows={3}
                    onChange={(text) =>
                      onChange(values.map((value, j) => (j === i ? text : value)))
                    }
                  />
                </div>
              )}
            </DragItem>
          ))}
        </DragList>
      )}
    </div>
  );
}
