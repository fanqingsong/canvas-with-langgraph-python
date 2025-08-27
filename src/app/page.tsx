"use client";

import { useCoAgent, useCopilotAction, useCoAgentStateRender, useCopilotAdditionalInstructions, useLangGraphInterrupt } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { useCallback, useEffect } from "react";
import type React from "react";

type WorkItemType = "Task" | "Bug" | "Research";
type Priority = "P0" | "P1" | "P2" | "P3";
type Status = "Not Started" | "In Progress" | "Blocked" | "Done";

interface Owner {
  id: string;
  name: string;
  avatarUrl: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  proposed: boolean;
}

interface LinkItem {
  title: string;
  url: string;
}

interface WorkItem {
  id: string;
  title: string;
  type: WorkItemType;
  priority: Priority;
  status: Status;
  owner: Owner;
  dueDate: string; // YYYY-MM-DD
  tags: string[];
  checklist: ChecklistItem[];
  description: string;
  links: LinkItem[];
}

interface ProjectInfo {
  name: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  workItem: WorkItem;
}

interface AgentState {
  projects: Project[];
}

const initialProjectId = "prj_" + Math.random().toString(36).slice(2, 8);
const initialState: AgentState = {
  projects: [
    {
      id: initialProjectId,
      name: "Example Project",
      description:
        "This is your project description. Summarize the goal and key context here. The agent and you will co-edit fields below.",
      workItem: {
        id: "WI1234",
        title: "Draft initial plan",
        type: "Task",
        priority: "P2",
        status: "Not Started",
        owner: { id: "u_1", name: "Unassigned", avatarUrl: "" },
        dueDate: "",
        tags: ["planning"],
        checklist: [
          { id: "c1", text: "Define scope", done: false, proposed: false },
          { id: "c2", text: "List milestones", done: false, proposed: false },
        ],
        description:
          "Write a short overview and proposed steps. The agent can propose edits you can accept or reject.",
        links: [],
      },
    },
  ],
};

export default function CopilotKitPage() {
  const { state, setState, running, run } = useCoAgent<AgentState>({
    name: "sample_agent",
    initialState,
  });

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[CoAgent state updated]", state);
  }, [JSON.stringify(state)]);

  useCoAgentStateRender<AgentState>({
    name: "sample_agent",
    render: ({ state: s }) => {
      const projects = s?.projects ?? initialState.projects;
      if (!projects.length) return null;
      return (
        <div className="text-xs text-violet-600">
          <div><span className="font-bold">Projects:</span> {projects.length}</div>
          <div><span className="font-bold">First owner:</span> {projects[0].workItem.owner.name}</div>
        </div>
      );
    },
  });

  // Strengthen grounding: always prefer shared state over chat history
  useCopilotAdditionalInstructions({
    instructions: (() => {
      const projects = state?.projects ?? initialState.projects;
      const summary = projects
        .slice(0, 5)
        .map((p) => `id=${p.id} • name=${p.name} • owner=${p.workItem.owner.name}`)
        .join("\n");
      return [
        "ALWAYS ANSWER FROM SHARED STATE (GROUND TRUTH).",
        "If a command does not specify which project to change, ask the user to clarify before proceeding.",
        "Projects (sample):",
        summary || "(none)",
      ].join("\n");
    })(),
  });

  // HITL: dropdown selector for project choice using LangGraph interrupt
  useLangGraphInterrupt({
    enabled: ({ eventValue }) => {
      try {
        return typeof eventValue === "object" && eventValue?.type === "choose_project";
      } catch {
        return false;
      }
    },
    render: ({ event, resolve }) => {
      const projects = state?.projects ?? initialState.projects;
      if (!projects.length) {
        return (
          <div className="rounded-md border bg-white p-4 text-sm shadow">
            <p>No projects available.</p>
            <button
              className="mt-3 rounded border px-3 py-1"
              onClick={() => resolve("")}
            >
              Close
            </button>
          </div>
        );
      }
      let selectedId = projects[0].id;
      return (
        <div className="rounded-md border bg-white p-4 text-sm shadow">
          <p className="mb-2 font-medium">Select a project</p>
          <p className="mb-3 text-xs text-gray-600">{(event?.value as any)?.content ?? "Which project should I use?"}</p>
          <select
            className="w-full rounded border px-2 py-1"
            defaultValue={selectedId}
            onChange={(e) => {
              selectedId = e.target.value;
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>
          <div className="mt-3 flex justify-end gap-2">
            <button
              className="rounded border px-3 py-1"
              onClick={() => resolve("")}
            >
              Cancel
            </button>
            <button
              className="rounded border bg-blue-600 px-3 py-1 text-white"
              onClick={() => resolve(selectedId)}
            >
              Use project
            </button>
          </div>
        </div>
      );
    },
  });

  const updateProject = useCallback(
    (projectId: string, updates: Partial<Project>) => {
      setState((prev) => {
        const base = prev ?? initialState;
        const projects: Project[] = base.projects ?? [];
        const nextProjects = projects.map((p) =>
          p.id === projectId ? { ...p, ...updates } : p
        );
        return { ...base, projects: nextProjects } as AgentState;
      });
    },
    [setState]
  );

  const updateWorkItem = useCallback(
    (projectId: string, updates: Partial<WorkItem>) => {
      setState((prev) => {
        const base = prev ?? initialState;
        const projects: Project[] = base.projects ?? [];
        const nextProjects = projects.map((p) =>
          p.id === projectId ? { ...p, workItem: { ...p.workItem, ...updates } } : p
        );
        return { ...base, projects: nextProjects } as AgentState;
      });
    },
    [setState]
  );

  const setChecklistItem = useCallback(
    (projectId: string, id: string, updates: Partial<ChecklistItem>) => {
      setState((prev) => {
        const base = prev ?? initialState;
        const projects: Project[] = base.projects ?? [];
        const nextProjects = projects.map((p) => {
          if (p.id !== projectId) return p;
          const nextChecklist = p.workItem.checklist.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          );
          return { ...p, workItem: { ...p.workItem, checklist: nextChecklist } };
        });
        return { ...base, projects: nextProjects } as AgentState;
      });
    },
    [setState]
  );

  const addChecklistItem = useCallback(
    (projectId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setState((prev) => {
        const base = prev ?? initialState;
        const next: ChecklistItem = {
          id: `c${Date.now()}`,
          text: trimmed,
          done: false,
          proposed: false,
        };
        const nextProjects = (base.projects ?? []).map((p) =>
          p.id === projectId
            ? { ...p, workItem: { ...p.workItem, checklist: [...p.workItem.checklist, next] } }
            : p
        );
        return { ...base, projects: nextProjects } as AgentState;
      });
    },
    [setState]
  );

  const removeChecklistItem = useCallback(
    (projectId: string, id: string) => {
      setState((prev) => {
        const base = prev ?? initialState;
        const nextProjects = (base.projects ?? []).map((p) =>
          p.id === projectId
            ? {
                ...p,
                workItem: {
                  ...p.workItem,
                  checklist: p.workItem.checklist.filter((i) => i.id !== id),
                },
              }
            : p
        );
        return { ...base, projects: nextProjects } as AgentState;
      });
    },
    [setState]
  );

  const addTag = useCallback(
    (projectId: string, tag: string) => {
      const next = tag.trim();
      if (!next) return;
      setState((prev) => {
        const base = prev ?? initialState;
        const nextProjects = (base.projects ?? []).map((p) => {
          if (p.id !== projectId) return p;
          if (p.workItem.tags.includes(next)) return p;
          return { ...p, workItem: { ...p.workItem, tags: [...p.workItem.tags, next] } };
        });
        return { ...base, projects: nextProjects } as AgentState;
      });
    },
    [setState]
  );

  const removeTag = useCallback(
    (projectId: string, tag: string) => {
      setState((prev) => {
        const base = prev ?? initialState;
        const nextProjects = (base.projects ?? []).map((p) =>
          p.id === projectId
            ? { ...p, workItem: { ...p.workItem, tags: p.workItem.tags.filter((t) => t !== tag) } }
            : p
        );
        return { ...base, projects: nextProjects } as AgentState;
      });
    },
    [setState]
  );

  const addProject = useCallback((name?: string, description?: string) => {
    const id = "prj_" + Date.now().toString(36);
    const project: Project = {
      id,
      name: name && name.trim() ? name.trim() : "Untitled Project",
      description:
        description && description.trim()
          ? description.trim()
          : "",
      workItem: {
        id: "wi_" + Date.now().toString(36),
        title: "New work item",
        type: "Task",
        priority: "P2",
        status: "Not Started",
        owner: { id: "u_1", name: "Unassigned", avatarUrl: "" },
        dueDate: "",
        tags: [],
        checklist: [],
        description: "",
        links: [],
      },
    };
    setState((prev) => {
      const base = prev ?? initialState;
      const nextProjects = [...(base.projects ?? []), project];
      return { ...base, projects: nextProjects, activeProjectId: id } as AgentState;
    });
    return id;
  }, [setState]);

  const setActiveProject = useCallback((projectId: string) => {
    setState((prev) => {
      const base = prev ?? initialState;
      return { ...base, activeProjectId: projectId } as AgentState;
    });
  }, [setState]);

  // Frontend Actions (exposed as tools to the agent via CopilotKit)
  useCopilotAction({
    name: "setProjectName",
    description: "Set a project's name.",
    available: "remote",
    parameters: [
      { name: "name", type: "string", required: true, description: "The new project name." },
      { name: "projectId", type: "string", required: true, description: "Target project id." },
    ],
    handler: ({ name, projectId }: { name: string; projectId: string }) => {
      updateProject(projectId, { name });
    },
  });

  useCopilotAction({
    name: "setProjectDescription",
    description: "Set a project's description.",
    available: "remote",
    parameters: [
      { name: "description", type: "string", required: true, description: "The new project description." },
      { name: "projectId", type: "string", required: true, description: "Target project id." },
    ],
    handler: ({ description, projectId }: { description: string; projectId: string }) => {
      updateProject(projectId, { description });
    },
  });

  useCopilotAction({
    name: "setWorkItemOwnerName",
    description: "Update the owner name for a project's work item.",
    available: "remote",
    parameters: [
      { name: "name", type: "string", required: true, description: "Full name of the owner." },
      { name: "projectId", type: "string", required: true, description: "Target project id." },
    ],
    handler: ({ name, projectId }: { name: string; projectId: string }) => {
      const project = (state?.projects ?? initialState.projects).find((p) => p.id === projectId) ?? initialState.projects[0];
      const currentOwner: Owner = project.workItem.owner;
      updateWorkItem(projectId, { owner: { ...currentOwner, name } });
    },
  });

  useCopilotAction({
    name: "createProject",
    description: "Create a new project.",
    available: "remote",
    parameters: [
      { name: "name", type: "string", required: false, description: "Optional project name." },
      { name: "description", type: "string", required: false, description: "Optional project description." },
    ],
    handler: ({ name, description }: { name?: string; description?: string }) => {
      addProject(name, description);
    },
  });


  return (
    <main
      style={{ "--copilot-kit-primary-color": "#2563eb" } as CopilotKitCSSProperties}
      className="min-h-screen"
    >
      <Header running={running} />

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">Projects</span>
          <button
            onClick={() => addProject()}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            New Project
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {(state?.projects ?? initialState.projects).map((project) => (
            <div key={project.id} className="rounded-2xl border p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">{project.id}</span>
              </div>

              <ProjectHeader
                name={project.name}
                description={project.description}
                onNameChange={(v) => {
                  updateProject(project.id, { name: v });
                }}
                onDescriptionChange={(v) => {
                  updateProject(project.id, { description: v });
                }}
              />

              <div className="mt-6">
                <WorkItemCard
                  item={project.workItem}
                  onChange={(updates) => {
                    const beforeOwner = project.workItem.owner.name;
                    updateWorkItem(project.id, updates);
                  }}
                  onSetChecklistItem={(id, updates) => {
                    updateWorkItem(project.id, {
                      checklist: project.workItem.checklist.map((c) => (c.id === id ? { ...c, ...updates } : c)),
                    });
                  }}
                  onAddChecklistItem={(text) => {
                    const trimmed = text.trim();
                    if (!trimmed) return;
                    updateWorkItem(project.id, {
                      checklist: [
                        ...project.workItem.checklist,
                        { id: `c${Date.now()}`, text: trimmed, done: false, proposed: false },
                      ],
                    });
                  }}
                  onRemoveChecklistItem={(id) => {
                    updateWorkItem(project.id, {
                      checklist: project.workItem.checklist.filter((c) => c.id !== id),
                    });
                  }}
                  onAddTag={(tag) => {
                    if (project.workItem.tags.includes(tag.trim())) return;
                    updateWorkItem(project.id, { tags: [...project.workItem.tags, tag.trim()] });
                  }}
                  onRemoveTag={(tag) => {
                    updateWorkItem(project.id, { tags: project.workItem.tags.filter((t) => t !== tag) });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <CopilotSidebar
        clickOutsideToClose={false}
        defaultOpen={true}
        labels={{
          title: "Agent",
          initial:
            "👋 Share a brief or ask to extract fields. Changes will sync with the canvas in real time.",
        }}
      />
    </main>
  );
}

function Header({ running }: { running: boolean }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: running ? "#22c55e" : "#eab308" }} />
          <span className="text-sm font-medium">AG-UI Canvas</span>
        </div>
        <span className="text-xs text-gray-500">sample_agent</span>
      </div>
    </header>
  );
}

function ProjectHeader(props: {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onNameCommit?: (value: string) => void;
  onDescriptionCommit?: (value: string) => void;
}) {
  const { name, description, onNameChange, onDescriptionChange, onNameCommit, onDescriptionCommit } = props;
  return (
    <div className="rounded-2xl border p-5 shadow-sm">
      <input
        value={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => onNameCommit?.(e.target.value)}
        placeholder="Project name"
        className="w-full appearance-none text-2xl font-semibold outline-none placeholder:text-gray-400"
      />
      <textarea
        value={description}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onDescriptionChange(e.target.value)}
        onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => onDescriptionCommit?.(e.target.value)}
        placeholder="Describe the project goals, constraints, and key context."
        className="mt-3 max-h-56 w-full resize-y overflow-auto rounded-lg border bg-white/60 p-3 text-sm leading-6 outline-none placeholder:text-gray-400"
        rows={4}
      />
    </div>
  );
}

function WorkItemCard(props: {
  item: WorkItem;
  onChange: (updates: Partial<WorkItem>) => void;
  onSetChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
  onAddChecklistItem: (text: string) => void;
  onRemoveChecklistItem: (id: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onOwnerCommit?: (newName: string) => void;
}) {
  const { item, onChange, onSetChecklistItem, onAddChecklistItem, onRemoveChecklistItem, onAddTag, onRemoveTag, onOwnerCommit } = props;

  return (
    <div className="rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <input
          value={item.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ title: e.target.value })}
          placeholder="Work item title"
          className="w-full appearance-none text-lg font-medium outline-none placeholder:text-gray-400"
        />
        <div className="flex items-center gap-2">
          <Select
            label="Type"
            value={item.type}
            onChange={(v) => onChange({ type: v })}
            options={["Task", "Bug", "Research"]}
          />
          <Select
            label="Priority"
            value={item.priority}
            onChange={(v) => onChange({ priority: v as Priority })}
            options={["P0", "P1", "P2", "P3"]}
          />
          <Select
            label="Status"
            value={item.status}
            onChange={(v) => onChange({ status: v as Status })}
            options={["Not Started", "In Progress", "Blocked", "Done"]}
          />
          <input
            value={item.dueDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ dueDate: e.target.value })}
            type="date"
            className="h-9 rounded-md border px-2 text-sm outline-none"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Owner</label>
            <input
              value={item.owner.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange({ owner: { ...item.owner, name: e.target.value } })
              }
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => onOwnerCommit?.(e.target.value)}
              placeholder="Assignee"
              className="w-full rounded-md border px-2 py-1.5 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Tags</label>
            <TagEditor tags={item.tags} onAdd={onAddTag} onRemove={onRemoveTag} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Checklist</label>
            <div className="space-y-2">
              {item.checklist.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={c.done}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSetChecklistItem(c.id, { done: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <input
                    value={c.text}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSetChecklistItem(c.id, { text: e.target.value })}
                    className="flex-1 rounded-md border px-2 py-1 text-sm outline-none"
                  />
                  <button
                    onClick={() => onRemoveChecklistItem(c.id)}
                    className="rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <AddChecklistInput onAdd={onAddChecklistItem} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
            <textarea
              value={item.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ description: e.target.value })}
              placeholder="Write details, context, or paste a brief."
              className="min-h-40 w-full resize-y rounded-md border bg-white/60 p-3 text-sm leading-6 outline-none"
              rows={8}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Related links</label>
            <LinkList
              links={item.links}
              onChange={(next) => onChange({ links: next })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Select<T extends string>(props: {
  label: string;
  value: T;
  options: readonly T[] | string[];
  onChange: (value: T) => void;
}) {
  const { label, value, options, onChange } = props;
  return (
    <div className="flex h-9 items-center gap-1 rounded-md border px-2">
      <span className="text-[11px] text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as T)}
        className="h-7 appearance-none bg-transparent pl-1 pr-4 text-sm outline-none"
      >
        {options.map((opt) => (
          <option key={String(opt)} value={String(opt)}>
            {String(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}

function TagEditor(props: { tags: string[]; onAdd: (tag: string) => void; onRemove: (tag: string) => void }) {
  const { tags, onAdd, onRemove } = props;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onAdd((e.target as HTMLInputElement).value);
      (e.target as HTMLInputElement).value = "";
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border p-2">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
          {t}
          <button className="text-gray-500" onClick={() => onRemove(t)} aria-label={`Remove ${t}`}>
            ×
          </button>
        </span>
      ))}
      <input
        onKeyDown={handleKeyDown}
        placeholder="Add tag and press Enter"
        className="min-w-32 flex-1 rounded-md px-1 text-sm outline-none"
      />
    </div>
  );
}

function AddChecklistInput(props: { onAdd: (text: string) => void }) {
  const { onAdd } = props;
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onAdd((e.target as HTMLInputElement).value);
      (e.target as HTMLInputElement).value = "";
    }
  };
  return (
    <input
      onKeyDown={onKeyDown}
      placeholder="+ Add item and press Enter"
      className="w-full rounded-md border px-2 py-1 text-sm outline-none"
    />
  );
}

function LinkList(props: {
  links: LinkItem[];
  onChange: (next: LinkItem[]) => void;
}) {
  const { links, onChange } = props;

  const add = () => {
    const title = window.prompt("Link title");
    const url = window.prompt("Link URL (https://…)");
    if (!title || !url) return;
    try {
      // basic validation
      // eslint-disable-next-line no-new
      new URL(url);
      onChange([...links, { title, url }]);
    } catch {
      // ignore invalid URL
    }
  };

  const removeAt = (idx: number) => {
    const next = links.slice(0, idx).concat(links.slice(idx + 1));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {links.length === 0 && <p className="text-xs text-gray-500">No links yet.</p>}
      {links.map((l, i) => (
        <div key={`${l.title}-${i}`} className="flex items-center justify-between gap-2 rounded-md border p-2">
          <a href={l.url} target="_blank" rel="noreferrer" className="truncate text-sm text-blue-600 underline">
            {l.title}
          </a>
          <button onClick={() => removeAt(i)} className="rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
            Remove
          </button>
        </div>
      ))}
      <button onClick={add} className="rounded-md border px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">
        + Add link
      </button>
    </div>
  );
}
