/** Projects with description, role, and stack chips. */

import { Folder } from "lucide-react";
import { TextField } from "../fields.tsx";
import { RichTextArea } from "../RichTextArea.tsx";
import { FormatScope, FormatToolbar } from "../FormatScope.tsx";
import { DragList, DragItem } from "../DragList.tsx";
import {
  AddButton,
  EmptyState,
  SubCardHead,
  newId,
  usePatch,
  type SectionProps,
} from "./shared.tsx";

export function ProjectsSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const addProject = () =>
    patch("projects", [
      ...resume.projects,
      { id: newId("p"), name: "", description: "", role: "", stack: [] },
    ]);

  if (resume.projects.length === 0) {
    return (
      <EmptyState
        sectionLabel="projects"
        icon={<Folder className="w-5 h-5" strokeWidth={2} />}
        heading="No projects yet"
        description="Showcase work you're proud of — a side project, open-source contribution, or flagship build."
        buttonLabel="Add a project"
        onAdd={addProject}
      />
    );
  }

  return (
    <>
      <DragList items={resume.projects} onReorder={(next) => patch("projects", next)}>
        {resume.projects.map((p, i) => (
          <FormatScope key={p.id}>
            <DragItem
              index={i}
              onDelete={() =>
                patch(
                  "projects",
                  resume.projects.filter((_, j) => j !== i),
                )
              }
            >
              {(handle, _deleteBtn) => (
                <div className="sub-card mb-2.5">
                  <SubCardHead
                    index={i}
                    prefix="Project"
                    drag={handle}
                    onDelete={() =>
                      patch(
                        "projects",
                        resume.projects.filter((_, j) => j !== i),
                      )
                    }
                  />
                  <div className="cr-stack">
                    <TextField
                      label="Name"
                      value={p.name}
                      onChange={(v) => {
                        const next = [...resume.projects];
                        next[i] = { ...p, name: v };
                        patch("projects", next);
                      }}
                    />
                    <div>
                      <div className="cr-field-row">
                        <span className="cr-field-label">Description</span>
                        <FormatToolbar compact />
                      </div>
                      <RichTextArea
                        value={p.description}
                        rows={5}
                        onChange={(v) => {
                          const next = [...resume.projects];
                          next[i] = { ...p, description: v };
                          patch("projects", next);
                        }}
                      />
                    </div>
                    <TextField
                      label="Role (optional)"
                      value={p.role ?? ""}
                      onChange={(v) => {
                        const next = [...resume.projects];
                        next[i] = { ...p, role: v };
                        patch("projects", next);
                      }}
                    />
                    <TextField
                      label="Stack (comma-separated)"
                      value={p.stack.join(", ")}
                      onChange={(v) => {
                        const next = [...resume.projects];
                        next[i] = {
                          ...p,
                          stack: v
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        };
                        patch("projects", next);
                      }}
                    />
                  </div>
                </div>
              )}
            </DragItem>
          </FormatScope>
        ))}
      </DragList>
      <div className="mt-3">
        <AddButton onClick={addProject}>Add project</AddButton>
      </div>
    </>
  );
}
