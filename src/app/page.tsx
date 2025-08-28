"use client";

import { useCoAgent, useCopilotAction, useCoAgentStateRender, useCopilotAdditionalInstructions, useLangGraphInterrupt } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotChat } from "@copilotkit/react-ui";
import { useCallback, useEffect } from "react";
import type React from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PanelLeftClose, PanelLeftOpen, Users, Plus } from "lucide-react"
import { Bot } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

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

interface ItemInfo {
  name: string;
  description: string;
}

interface Item {
  id: string;
  name: string;
  description: string;
  workItem: WorkItem;
}

interface AgentState {
  items: Item[];
  globalTitle: string;
  globalDescription: string;
  activeItemId: string | null;
}

const initialState: AgentState = {
  items: [],
  globalTitle: "",
  globalDescription: "",
  activeItemId: null,
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
    render: ({ state }) => {
      const items = state?.items ?? initialState.items;
      const globalTitle = state?.globalTitle ?? initialState.globalTitle;
      const globalDescription = state?.globalDescription ?? initialState.globalDescription;
      return (
        <pre className="whitespace-pre-wrap text-xs text-violet-600 font-mono w-full overflow-hidden">
          {JSON.stringify({
            items,
            globalTitle,
            globalDescription,
          }, null, 2)}
        </pre>
      );
    },
  });

  // Strengthen grounding: always prefer shared state over chat history
  useCopilotAdditionalInstructions({
    instructions: (() => {
      const items = state?.items ?? initialState.items;
      const gTitle = state?.globalTitle ?? "";
      const gDesc = state?.globalDescription ?? "";
      const summary = items
        .slice(0, 5)
        .map((p) => `id=${p.id} • name=${p.name} • owner=${p.workItem.owner.name}`)
        .join("\n");
      return [
        "ALWAYS ANSWER FROM SHARED STATE (GROUND TRUTH).",
        "If a command does not specify which item to change, ask the user to clarify before proceeding.",
        `Global Title: ${gTitle || "(none)"}`,
        `Global Description: ${gDesc || "(none)"}`,
        "Items (sample):",
        summary || "(none)",
      ].join("\n");
    })(),
  });

  // HITL: dropdown selector for item choice using LangGraph interrupt
  useLangGraphInterrupt({
    enabled: ({ eventValue }) => {
      try {
        return typeof eventValue === "object" && eventValue?.type === "choose_item";
      } catch {
        return false;
      }
    },
    render: ({ event, resolve }) => {
      const items = state?.items ?? initialState.items;
      if (!items.length) {
        return (
          <div className="rounded-md border bg-white p-4 text-sm shadow">
            <p>No items available.</p>
            <button
              className="mt-3 rounded border px-3 py-1"
              onClick={() => resolve("")}
            >
              Close
            </button>
          </div>
        );
      }
      let selectedId = items[0].id;
      return (
        <div className="rounded-md border bg-white p-4 text-sm shadow">
          <p className="mb-2 font-medium">Select an item</p>
          <p className="mb-3 text-xs text-gray-600">{(event?.value as any)?.content ?? "Which item should I use?"}</p>
          <select
            className="w-full rounded border px-2 py-1"
            defaultValue={selectedId}
            onChange={(e) => {
              selectedId = e.target.value;
            }}
          >
            {items.map((p) => (
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
              Use item
            </button>
          </div>
        </div>
      );
    },
  });

  const updateItem = useCallback(
    (itemId: string, updates: Partial<Item>) => {
      setState((prev) => {
        const base = prev ?? initialState;
        const items: Item[] = base.items ?? [];
        const nextItems = items.map((p) =>
          p.id === itemId ? { ...p, ...updates } : p
        );
        return { ...base, items: nextItems } as AgentState;
      });
    },
    [setState]
  );

  const updateWorkItem = useCallback(
    (itemId: string, updates: Partial<WorkItem>) => {
      setState((prev) => {
        const base = prev ?? initialState;
        const items: Item[] = base.items ?? [];
        const nextItems = items.map((p) =>
          p.id === itemId ? { ...p, workItem: { ...p.workItem, ...updates } } : p
        );
        return { ...base, items: nextItems } as AgentState;
      });
    },
    [setState]
  );

  const setChecklistItem = useCallback(
    (itemId: string, id: string, updates: Partial<ChecklistItem>) => {
      setState((prev) => {
        const base = prev ?? initialState;
        const items: Item[] = base.items ?? [];
        const nextItems = items.map((p) => {
          if (p.id !== itemId) return p;
          const nextChecklist = p.workItem.checklist.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          );
          return { ...p, workItem: { ...p.workItem, checklist: nextChecklist } };
        });
        return { ...base, items: nextItems } as AgentState;
      });
    },
    [setState]
  );

  const addChecklistItem = useCallback(
    (itemId: string, text: string) => {
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
        const nextItems = (base.items ?? []).map((p: Item) =>
          p.id === itemId
            ? { ...p, workItem: { ...p.workItem, checklist: [...p.workItem.checklist, next] } }
            : p
        );
        return { ...base, items: nextItems } as AgentState;
      });
    },
    [setState]
  );

  const removeChecklistItem = useCallback(
    (itemId: string, id: string) => {
      setState((prev) => {
        const base = prev ?? initialState;
        const nextItems = (base.items ?? []).map((p: Item) =>
          p.id === itemId
            ? {
                ...p,
                workItem: {
                  ...p.workItem,
                  checklist: p.workItem.checklist.filter((i) => i.id !== id),
                },
              }
            : p
        );
        return { ...base, items: nextItems } as AgentState;
      });
    },
    [setState]
  );

  const addTag = useCallback(
    (itemId: string, tag: string) => {
      const next = tag.trim();
      if (!next) return;
      setState((prev) => {
        const base = prev ?? initialState;
        const nextItems = (base.items ?? []).map((p: Item) => {
          if (p.id !== itemId) return p;
          if (p.workItem.tags.includes(next)) return p;
          return { ...p, workItem: { ...p.workItem, tags: [...p.workItem.tags, next] } };
        });
        return { ...base, items: nextItems } as AgentState;
      });
    },
    [setState]
  );

  const removeTag = useCallback(
    (itemId: string, tag: string) => {
      setState((prev) => {
        const base = prev ?? initialState;
        const nextItems = (base.items ?? []).map((p: Item) =>
          p.id === itemId
            ? { ...p, workItem: { ...p.workItem, tags: p.workItem.tags.filter((t) => t !== tag) } }
            : p
        );
        return { ...base, items: nextItems } as AgentState;
      });
    },
    [setState]
  );

  const addItem = useCallback((name?: string, description?: string) => {
    const id = "prj_" + Date.now().toString(36);
    const item: Item = {
      id,
      name: name && name.trim() ? name.trim() : "Untitled Item",
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
      const nextItems = [...(base.items ?? []), item];
      return { ...base, items: nextItems, activeItemId: id } as AgentState;
    });
    return id;
  }, [setState]);

  const setActiveItem = useCallback((itemId: string) => {
    setState((prev) => {
      const base = prev ?? initialState;
      return { ...base, activeItemId: itemId } as AgentState;
    });
  }, [setState]);

  // Frontend Actions (exposed as tools to the agent via CopilotKit)
  useCopilotAction({
    name: "setGlobalTitle",
    description: "Set the global title (outside of items).",
    available: "remote",
    parameters: [
      { name: "title", type: "string", required: true, description: "The new global title." },
    ],
    handler: ({ title }: { title: string }) => {
      setState((prev) => ({ ...(prev ?? initialState), globalTitle: title }));
    },
  });

  useCopilotAction({
    name: "setGlobalDescription",
    description: "Set the global description (outside of items).",
    available: "remote",
    parameters: [
      { name: "description", type: "string", required: true, description: "The new global description." },
    ],
    handler: ({ description }: { description: string }) => {
      setState((prev) => ({ ...(prev ?? initialState), globalDescription: description }));
    },
  });

  // Frontend Actions (item-scoped)
  useCopilotAction({
    name: "setItemName",
    description: "Set an item's name.",
    available: "remote",
    parameters: [
      { name: "name", type: "string", required: true, description: "The new item name." },
      { name: "itemId", type: "string", required: true, description: "Target item id." },
    ],
    handler: ({ name, itemId }: { name: string; itemId: string }) => {
      updateItem(itemId, { name });
    },
  });

  useCopilotAction({
    name: "setItemDescription",
    description: "Set an item's description.",
    available: "remote",
    parameters: [
      { name: "description", type: "string", required: true, description: "The new item description." },
      { name: "itemId", type: "string", required: true, description: "Target item id." },
    ],
    handler: ({ description, itemId }: { description: string; itemId: string }) => {
      updateItem(itemId, { description });
    },
  });

  useCopilotAction({
    name: "setWorkItemOwnerName",
    description: "Update the owner name for an item's work item.",
    available: "remote",
    parameters: [
      { name: "name", type: "string", required: true, description: "Full name of the owner." },
      { name: "itemId", type: "string", required: true, description: "Target item id." },
    ],
    handler: ({ name, itemId }: { name: string; itemId: string }) => {
      const found = (state?.items ?? initialState.items).find((p) => p.id === itemId);
      const currentOwner: Owner = found ? found.workItem.owner : { id: "u_1", name: "Unassigned", avatarUrl: "" };
      updateWorkItem(itemId, { owner: { ...currentOwner, name } });
    },
  });

  useCopilotAction({
    name: "createItem",
    description: "Create a new item.",
    available: "remote",
    parameters: [
      { name: "name", type: "string", required: false, description: "Optional item name." },
      { name: "description", type: "string", required: false, description: "Optional item description." },
    ],
    handler: ({ name, description }: { name?: string; description?: string }) => {
      addItem(name, description);
    },
  });

  const titleClasses = cn(
    /* base styles */
    "w-full outline-none rounded-md px-2 py-1",
    "bg-transparent placeholder:text-gray-400",
    "ring-1 ring-transparent transition-all ease-out",
    /* hover styles */
    "hover:ring-border",
    /* focus styles */
    "focus:ring-2 focus:ring-accent/50 focus:shadow-sm focus:bg-accent/10",
    "focus:shadow-accent focus:placeholder:text-accent/65 focus:text-accent",
  );

  return (
    <div
      style={{ "--copilot-kit-primary-color": "#2563eb" } as CopilotKitCSSProperties}
      className="h-screen flex flex-col"
    >
      {/* Header */}
      <Header running={running} onAddItem={() => addItem()} />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-auto px-4 py-6">
          <div className="flex flex-col mx-auto max-w-7xl h-full min-h-8">
            {/* Global Title & Description */}
            <div className="mb-6">
              <input
                value={state?.globalTitle ?? initialState.globalTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setState((prev) => ({ ...(prev ?? initialState), globalTitle: e.target.value }))
                }
                placeholder="Canvas title..."
                className={cn(titleClasses, "text-2xl font-semibold")}
              />
              <TextareaAutosize
                value={state?.globalDescription ?? initialState.globalDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setState((prev) => ({ ...(prev ?? initialState), globalDescription: e.target.value }))
                }
                minRows={1}
                placeholder="Canvas description..."
                className={cn(titleClasses, "mt-2 text-sm leading-6 resize-none overflow-hidden")}
              />
            </div>
            {(state?.items ?? []).length === 0 ? (
              <EmptyState className="flex-1" onAddItem={() => addItem()} />
            ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {(state?.items ?? initialState.items).map((item) => (
                <div key={item.id} className="rounded-2xl border p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">{item.id}</span>
                  </div>

                  <ItemHeader
                    name={item.name}
                    description={item.description}
                    onNameChange={(v) => {
                      updateItem(item.id, { name: v });
                    }}
                    onDescriptionChange={(v) => {
                      updateItem(item.id, { description: v });
                    }}
                  />

                  <div className="mt-6">
                    <WorkItemCard
                      item={item.workItem}
                      onChange={(updates) => {
                        const beforeOwner = item.workItem.owner.name;
                        updateWorkItem(item.id, updates);
                      }}
                      onSetChecklistItem={(id, updates) => {
                        updateWorkItem(item.id, {
                          checklist: item.workItem.checklist.map((c) => (c.id === id ? { ...c, ...updates } : c)),
                        });
                      }}
                      onAddChecklistItem={(text) => {
                        const trimmed = text.trim();
                        if (!trimmed) return;
                        updateWorkItem(item.id, {
                          checklist: [
                            ...item.workItem.checklist,
                            { id: `c${Date.now()}`, text: trimmed, done: false, proposed: false },
                          ],
                        });
                      }}
                      onRemoveChecklistItem={(id) => {
                        updateWorkItem(item.id, {
                          checklist: item.workItem.checklist.filter((c) => c.id !== id),
                        });
                      }}
                      onAddTag={(tag) => {
                        if (item.workItem.tags.includes(tag.trim())) return;
                        updateWorkItem(item.id, { tags: [...item.workItem.tags, tag.trim()] });
                      }}
                      onRemoveTag={(tag) => {
                        updateWorkItem(item.id, { tags: item.workItem.tags.filter((t) => t !== tag) });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </main>

        {/* Chat Sidebar */}
        <aside className="flex flex-col align-start w-80 border-l border-sidebar-border bg-sidebar shadow-lg">
          {/* Chat Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-sidebar-foreground">AI Assistant</h3>
                <div className="flex items-center gap-x-1.5 text-xs text-muted-foreground">
                  <div className="inline-block size-1.5 rounded-full bg-green-500" />
                  <div>Online <span className="opacity-50 text-[90%] select-none">•</span> Ready to help</div>
                </div>
              </div>
            </div>
          </div>
          {/* Chat Content */}
          <CopilotChat
            className="flex-1 overflow-auto w-full"
            labels={{
              title: "Agent",
              initial:
                "👋 Share a brief or ask to extract fields. Changes will sync with the canvas in real time.",
            }}
          />
        </aside>
      </div>
    </div>
  );
}

function Header({ running, onAddItem }: { running: boolean; onAddItem: () => void }) {
  return (
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="font-sans font-bold text-xl text-foreground tracking-tight">AG-UI Canvas</h1>
          <div className="text-sm text-muted-foreground font-medium">Collaborative AI Workspace</div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 font-medium bg-transparent" onClick={onAddItem}>
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </header>
  );
}

function ItemHeader(props: {
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
        placeholder="Item name"
        className="w-full appearance-none text-2xl font-semibold outline-none placeholder:text-gray-400"
      />
      <textarea
        value={description}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onDescriptionChange(e.target.value)}
        onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => onDescriptionCommit?.(e.target.value)}
        placeholder="Describe this item."
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
