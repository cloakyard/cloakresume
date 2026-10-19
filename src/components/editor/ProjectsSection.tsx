/** Projects with description, role bullets, and stack chips. */

import { Folder } from "lucide-react";
import { CsvField, TextField } from "../fields.tsx";
import { RichTextArea } from "../RichTextArea.tsx";
import { FormatScope, FormatToolbar } from "../FormatScope.tsx";
import { BulletList } from "./BulletList.tsx";
import { DragList, DragItem } from "../DragList.tsx";
import {
  AddButton,
  EmptyState,
  EntryHeading,
  newId,
  usePatch,
  type SectionProps,
} from "./shared.tsx";

export function ProjectsSection({ resume, onChange }: SectionProps) {
  const patch = usePatch(resume, onChange);
  const addProject = () =>
    patch("projects", [
      ...resume.projects,
      { id: newId("p"), name: "", description: "", roles: [], stack: [] },
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
        {resume.projects.map((p, i) => {
          const roles = p.roles ?? [];
          return (
            <FormatScope key={p.id}>
              <DragItem
                index={i}
                label={`project ${i + 1}`}
                onDelete={() =>
                  patch(
                    "projects",
                    resume.projects.filter((_, j) => j !== i),
                  )
                }
              >
                {(handle, deleteBtn, moveBtns) => (
                  <div className="resume-entry">
                    <EntryHeading
                      index={i}
                      prefix="Project"
                      drag={handle}
                      moveBtns={moveBtns}
                      deleteButton={deleteBtn}
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
                      <div className="cr-field">
                        <div className="cr-field-row">
                          <span className="air-label">Description</span>
                          <FormatToolbar />
                        </div>
                        <RichTextArea
                          ariaLabel="Project description"
                          fieldId={`projects.${i}.description`}
                          value={p.description}
                          rows={5}
                          onChange={(v) => {
                            const next = [...resume.projects];
                            next[i] = { ...p, description: v };
                            patch("projects", next);
                          }}
                        />
                      </div>
                      <BulletList
                        values={roles}
                        itemLabel={`project ${i + 1}`}
                        ariaLabel="Project role bullet"
                        fieldPrefix={`projects.${i}.roles`}
                        label="Role (optional)"
                        emptyText="Add bullets to describe your ownership, responsibilities, or impact on this project."
                        onChange={(roles) => {
                          const next = [...resume.projects];
                          next[i] = { ...p, roles };
                          patch("projects", next);
                        }}
                      />
                      <CsvField
                        label="Stack (comma-separated)"
                        value={p.stack}
                        onChange={(v) => {
                          const next = [...resume.projects];
                          next[i] = { ...p, stack: v };
                          patch("projects", next);
                        }}
                      />
                    </div>
                  </div>
                )}
              </DragItem>
            </FormatScope>
          );
        })}
      </DragList>
      <AddButton onClick={addProject}>Add project</AddButton>
    </>
  );
}
