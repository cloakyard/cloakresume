/** Projects with description, role bullets, and stack chips. */

import { Folder, Plus } from "lucide-react";
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
                onDelete={() =>
                  patch(
                    "projects",
                    resume.projects.filter((_, j) => j !== i),
                  )
                }
              >
                {(handle, _deleteBtn, moveBtns) => (
                  <div className="sub-card mb-2.5">
                    <SubCardHead
                      index={i}
                      prefix="Project"
                      drag={handle}
                      moveBtns={moveBtns}
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
                      <div>
                        <div className="cr-field-row">
                          <span className="cr-field-label">Role (optional)</span>
                          <div className="flex items-center gap-1">
                            <FormatToolbar compact />
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...resume.projects];
                                next[i] = { ...p, roles: [...roles, ""] };
                                patch("projects", next);
                              }}
                              className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11.5px] text-(--brand) hover:bg-(--brand-50) font-semibold transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Bullet
                            </button>
                          </div>
                        </div>
                        {roles.length === 0 ? (
                          <p className="text-[11.5px] text-(--c-muted) leading-snug">
                            Add bullets to describe your ownership, responsibilities, or impact on
                            this project.
                          </p>
                        ) : (
                          <DragList
                            items={roles}
                            onReorder={(nextRoles) => {
                              const nextProjects = [...resume.projects];
                              nextProjects[i] = { ...p, roles: nextRoles };
                              patch("projects", nextProjects);
                            }}
                          >
                            {roles.map((r, ri) => (
                              <DragItem
                                // oxlint-disable-next-line jsx/no-array-index-key
                                key={`${p.id}-role-${ri}`}
                                index={ri}
                                compact
                                stackMoves
                                onDelete={() => {
                                  const next = [...resume.projects];
                                  next[i] = {
                                    ...p,
                                    roles: roles.filter((_, rj) => rj !== ri),
                                  };
                                  patch("projects", next);
                                }}
                              >
                                {(rHandle, rDelete, rMove) => (
                                  <div
                                    className={`flex gap-1.5 items-start ${ri > 0 ? "mt-2.5" : ""}`}
                                  >
                                    <div className="mt-2">{rHandle}</div>
                                    <div className="flex-1">
                                      <RichTextArea
                                        fieldId={`projects.${i}.roles.${ri}`}
                                        value={r}
                                        rows={3}
                                        compact
                                        onChange={(v) => {
                                          const next = [...resume.projects];
                                          const nextRoles = [...roles];
                                          nextRoles[ri] = v;
                                          next[i] = { ...p, roles: nextRoles };
                                          patch("projects", next);
                                        }}
                                      />
                                    </div>
                                    <div className="mt-2 flex flex-col items-center gap-0">
                                      {rMove}
                                      {rDelete}
                                    </div>
                                  </div>
                                )}
                              </DragItem>
                            ))}
                          </DragList>
                        )}
                      </div>
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
          );
        })}
      </DragList>
      <div className="mt-3">
        <AddButton onClick={addProject}>Add project</AddButton>
      </div>
    </>
  );
}
