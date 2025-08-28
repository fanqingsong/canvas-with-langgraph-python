"use client";

import { useCoAgent, useCopilotAction, useCoAgentStateRender, useCopilotAdditionalInstructions, useLangGraphInterrupt } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotChat } from "@copilotkit/react-ui";
import { useCallback, useEffect } from "react";
import type React from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PanelLeftClose, PanelLeftOpen, Users, Plus, X } from "lucide-react"
import { Bot } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

function NewItemMenu({ onSelect, align = "end" }: { onSelect: (t: CardType) => void; align?: "start" | "end" | "center" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-medium bg-background">
          <Plus className="h-4 w-4" />
          New
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-40 bg-background">
        <DropdownMenuItem onClick={() => onSelect("work")}>Work item</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("entity")}>Entity</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("notes")}>Notes</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("chart")}>Chart</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

type CardType = "work" | "entity" | "notes" | "chart";

interface WorkData {
  field1: string;
  field2: string;
  field3Date: string; // YYYY-MM-DD
  checklist: ChecklistItem[];
}

interface EntityData {
  field1: string;
  field2: string;
  tagsAvailable: string[];
  tags: string[];
}

interface NotesData {
  content?: string;
}

interface ChartMetric {
  label: string;
  value: number; // 0..100
}

interface ChartData {
  metrics: ChartMetric[];
}

type ItemData = WorkData | EntityData | NotesData | ChartData;

interface Item {
  id: string;
  type: CardType;
  name: string; // editable title
  subtitle: string; // subtitle shown under the title
  data: ItemData;
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
        .map((p: Item) => `id=${p.id} • name=${p.name} • type=${p.type}`)
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

  // HITL: choose a card type when not specified
  useLangGraphInterrupt({
    enabled: ({ eventValue }) => {
      try {
        return typeof eventValue === "object" && eventValue?.type === "choose_card_type";
      } catch {
        return false;
      }
    },
    render: ({ event, resolve }) => {
      const options: { id: CardType; label: string }[] = [
        { id: "work", label: "Work item" },
        { id: "entity", label: "Entity" },
        { id: "notes", label: "Notes" },
        { id: "chart", label: "Chart" },
      ];
      let selected: CardType = options[0].id;
      return (
        <div className="rounded-md border bg-white p-4 text-sm shadow">
          <p className="mb-2 font-medium">Select a card type</p>
          <p className="mb-3 text-xs text-gray-600">{(event?.value as any)?.content ?? "Which type of card should I create?"}</p>
          <select
            className="w-full rounded border px-2 py-1"
            defaultValue={selected}
            onChange={(e) => {
              selected = e.target.value as CardType;
            }}
          >
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <div className="mt-3 flex justify-end gap-2">
            <button className="rounded border px-3 py-1" onClick={() => resolve("")}>Cancel</button>
            <button className="rounded border bg-blue-600 px-3 py-1 text-white" onClick={() => resolve(selected)}>Use type</button>
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
        const nextItems = items.map((p) => (p.id === itemId ? { ...p, ...updates } : p));
        return { ...base, items: nextItems } as AgentState;
      });
    },
    [setState]
  );

  const updateItemData = useCallback(
    (itemId: string, updater: (prev: ItemData) => ItemData) => {
      setState((prev) => {
        const base = prev ?? initialState;
        const items: Item[] = base.items ?? [];
        const nextItems = items.map((p) => (p.id === itemId ? { ...p, data: updater(p.data) } : p));
        return { ...base, items: nextItems } as AgentState;
      });
    },
    [setState]
  );

  const deleteItem = useCallback((itemId: string) => {
    setState((prev) => {
      const base = prev ?? initialState;
      const items: Item[] = (base.items ?? []).filter((p) => p.id !== itemId);
      const activeItemId = base.activeItemId === itemId ? null : base.activeItemId;
      return { ...base, items, activeItemId } as AgentState;
    });
  }, [setState]);

  const setChecklistItem = useCallback(
    (itemId: string, id: string, updates: Partial<ChecklistItem>) => {
      updateItemData(itemId, (prev) => prev);
    },
    [updateItemData]
  );

  const toggleTag = useCallback((itemId: string, tag: string) => {
    updateItemData(itemId, (prev) => {
      const anyPrev = prev as any;
      if (Array.isArray(anyPrev.tags)) {
        const selected = new Set<string>(anyPrev.tags ?? []);
        if (selected.has(tag)) selected.delete(tag); else selected.add(tag);
        return { ...anyPrev, tags: Array.from(selected) } as ItemData;
      }
      return prev;
    });
  }, [updateItemData]);

  const removeChecklistItem = useCallback(
    (itemId: string, id: string) => {
      // no-op in simplified schema
    },
    []
  );

  // Helper to generate default data by type
  const defaultDataFor = useCallback((type: CardType): ItemData => {
    switch (type) {
      case "work":
        return {
          field1: "",
          field2: "",
          field3Date: "",
          checklist: [],
        } as WorkData;
      case "entity":
        return {
          field1: "",
          field2: "",
          tagsAvailable: ["Priority", "Active", "Premium"],
          tags: [],
        } as EntityData;
      case "notes":
        return { content: "" } as NotesData;
      case "chart":
        return { metrics: [
          { label: "Metric A", value: 0 },
          { label: "Metric B", value: 0 },
          { label: "Metric C", value: 0 },
        ] } as ChartData;
      default:
        return { content: "" } as NotesData;
    }
  }, []);

  const removeTag = useCallback(
    (itemId: string, tag: string) => {
      updateItemData(itemId, (prev) => {
        const anyPrev = prev as any;
        if (Array.isArray(anyPrev.tags)) {
          return { ...anyPrev, tags: (anyPrev.tags as string[]).filter((t) => t !== tag) } as ItemData;
        }
        return prev;
      });
    },
    [updateItemData]
  );

  const addItem = useCallback((type?: CardType, name?: string) => {
    const id = "itm_" + Date.now().toString(36);
    const t: CardType = type ?? "work";
    const item: Item = {
      id,
      type: t,
      name: name && name.trim() ? name.trim() : "",
      subtitle: "",
      data: defaultDataFor(t),
    };
    setState((prev) => {
      const base = prev ?? initialState;
      const nextItems = [...(base.items ?? []), item];
      return { ...base, items: nextItems, activeItemId: id } as AgentState;
    });
    return id;
  }, [defaultDataFor, setState]);

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
      { name: "description", type: "string", required: true, description: "The new item description (Notes only)." },
      { name: "itemId", type: "string", required: true, description: "Target item id." },
    ],
    handler: ({ description, itemId }: { description: string; itemId: string }) => {
      updateItemData(itemId, (prev) => {
        if ((prev as NotesData).content !== undefined) {
          return { ...(prev as NotesData), content: description } as NotesData;
        }
        return prev;
      });
    },
  });

  useCopilotAction({
    name: "setWorkItemOwnerName",
    description: "Update field1 for an item (work/entity).",
    available: "remote",
    parameters: [
      { name: "value", type: "string", required: true, description: "New value for field1." },
      { name: "itemId", type: "string", required: true, description: "Target item id." },
    ],
    handler: ({ value, itemId }: { value: string; itemId: string }) => {
      updateItemData(itemId, (prev) => {
        const anyPrev = prev as any;
        if (typeof anyPrev.field1 === "string") {
          return { ...anyPrev, field1: value } as ItemData;
        }
        return prev;
      });
    },
  });

  useCopilotAction({
    name: "createItem",
    description: "Create a new item.",
    available: "remote",
    parameters: [
      { name: "type", type: "string", required: false, description: "One of: work, entity, notes, chart." },
      { name: "name", type: "string", required: false, description: "Optional item name." },
    ],
    handler: ({ type, name }: { type?: string; name?: string }) => {
      const t = (type as CardType | undefined);
      addItem(t, name);
    },
  });

  // Frontend action: delete an item by id
  useCopilotAction({
    name: "deleteItem",
    description: "Delete an item by id.",
    available: "remote",
    parameters: [
      { name: "itemId", type: "string", required: true, description: "Target item id." },
    ],
    handler: ({ itemId }: { itemId: string }) => {
      deleteItem(itemId);
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
      <Header running={running} addTypedItem={(t) => addItem(t)} />

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
              <EmptyState className="flex-1">
                <div className="mx-auto max-w-lg text-center">
                  <h2 className="text-lg font-semibold text-foreground">Nothing here yet</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Create your first item to get started.</p>
                  <div className="mt-6 flex justify-center">
                    <NewItemMenu onSelect={(t) => addItem(t)} align="center" />
                  </div>
                </div>
              </EmptyState>
            ) : (
            <div className="grid gap-6 md:grid-cols-2 pb-6">
              {(state?.items ?? initialState.items).map((item) => (
                <article key={item.id} className="relative rounded-2xl border p-5 shadow-sm transition-colors ease-out bg-card hover:border-accent/40 focus-within:border-accent/60">
                  <button
                    type="button"
                    aria-label="Delete card"
                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-400 hover:bg-accent/10 hover:text-accent transition-colors"
                    onClick={() => deleteItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <ItemHeader
                    name={item.name}
                    subtitle={item.subtitle}
                    description={""}
                    onNameChange={(v) => updateItem(item.id, { name: v })}
                    onSubtitleChange={(v) => updateItem(item.id, { subtitle: v })}
                    onDescriptionChange={(v) => updateItemData(item.id, (prev) => prev)}
                  />

                  <div className="mt-6">
                    <CardRenderer item={item} onUpdateData={(updater) => updateItemData(item.id, updater)} onToggleTag={(tag) => toggleTag(item.id, tag)} />
                  </div>
                </article>
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

function Header({ running, onAddItem, addTypedItem }: { running: boolean; onAddItem?: () => void; addTypedItem?: (t: CardType) => void }) {
  return (
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="font-sans font-bold text-xl text-foreground tracking-tight">AG-UI Canvas</h1>
          <div className="text-sm text-muted-foreground font-medium">Collaborative AI Workspace</div>
        </div>
        <div className="flex items-center gap-3">
          <NewItemMenu onSelect={(t) => addTypedItem?.(t)} />
        </div>
      </header>
  );
}

function ItemHeader(props: {
  name: string;
  subtitle: string;
  description: string;
  onNameChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onNameCommit?: (value: string) => void;
  onDescriptionCommit?: (value: string) => void;
}) {
  const { name, subtitle, description, onNameChange, onSubtitleChange, onDescriptionChange, onNameCommit, onDescriptionCommit } = props;
  return (
    <div className="mb-4">
      <input
        value={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => onNameCommit?.(e.target.value)}
        placeholder="Item title"
        className="w-full appearance-none text-2xl font-semibold outline-none placeholder:text-gray-400 transition-colors focus:text-accent focus:placeholder:text-accent/65"
      />
      <TextareaAutosize
        value={subtitle}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onSubtitleChange(e.target.value)}
        placeholder="Optional subtitle or short description"
        className="mt-2 w-full bg-transparent text-sm leading-6 resize-none outline-none placeholder:text-gray-400 transition-colors focus:text-accent focus:placeholder:text-accent/65"
        minRows={1}
      />
    </div>
  );
}

function CardRenderer(props: {
  item: Item;
  onUpdateData: (updater: (prev: ItemData) => ItemData) => void;
  onToggleTag: (tag: string) => void;
}) {
  const { item, onUpdateData, onToggleTag } = props;

  if (item.type === "notes") {
    const d = item.data as NotesData;
    return (
      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-gray-500">Field 1 (e.g., Rich Text Content)</label>
        <TextareaAutosize
          value={d.content ?? ""}
          onChange={(e) => onUpdateData(() => ({ content: e.target.value }))}
          placeholder="Write notes or description..."
          className="min-h-40 w-full resize-none rounded-md border bg-white/60 p-3 text-sm leading-6 outline-none placeholder:text-gray-400 transition-colors hover:ring-1 hover:ring-border focus:ring-2 focus:ring-accent/50 focus:shadow-sm focus:bg-accent/10 focus:text-accent focus:placeholder:text-accent/65"
          minRows={6}
        />
      </div>
    );
  }

  if (item.type === "chart") {
    const d = item.data as ChartData;
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium">Simple Bar Chart</span>
        </div>
        <div className="space-y-3">
          {d.metrics.map((m, i) => (
            <div key={`${m.label}-${i}`} className="grid grid-cols-[120px_1fr_40px] items-center gap-3">
              <span className="text-sm text-muted-foreground">{m.label}</span>
              <Progress value={m.value} />
              <input
                className={cn(
                  "w-12 rounded-md border px-2 py-1 text-xs outline-none appearance-none [-moz-appearance:textfield]",
                  "[&::-webkit-outer-spin-button]:[-webkit-appearance:none] [&::-webkit-outer-spin-button]:m-0",
                  "[&::-webkit-inner-spin-button]:[-webkit-appearance:none] [&::-webkit-inner-spin-button]:m-0",
                  "transition-colors hover:ring-1 hover:ring-border focus:ring-2 focus:ring-accent/50 focus:shadow-sm focus:bg-accent/10 focus:text-accent",
                )}
                type="number"
                min={0}
                max={100}
                value={m.value}
                onChange={(e) => onUpdateData((prev) => {
                  const cd = prev as ChartData;
                  const next = [...cd.metrics];
                  next[i] = { ...next[i], value: Math.max(0, Math.min(100, Number(e.target.value))) };
                  return { ...cd, metrics: next };
                })}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (item.type === "work") {
    const d = item.data as WorkData;
    const set = (partial: Partial<WorkData>) => onUpdateData((prev) => ({ ...(prev as WorkData), ...partial }));
    return (
      <div className="mt-4 @container">
        {/* Field 1 full width */}
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-gray-500">Field 1</label>
          <input
            value={d.field1}
            onChange={(e) => set({ field1: e.target.value })}
            className="w-full rounded-md border px-2 py-1.5 text-sm outline-none transition-colors placeholder:text-gray-400 hover:ring-1 hover:ring-border focus:ring-2 focus:ring-accent/50 focus:shadow-sm focus:bg-accent/10 focus:text-accent focus:placeholder:text-accent/65"
            placeholder="Field 1 value"
          />
        </div>
        {/* Row 2 split */}
        <div className="contents @xs:grid gap-3 md:grid-cols-2">
          <div className="@max-xs:mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-500">Field 2</label>
            <select
              value={d.field2}
              onChange={(e) => set({ field2: e.target.value })}
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm outline-none transition-colors hover:ring-1 hover:ring-border focus:ring-2 focus:ring-accent/50 focus:shadow-sm focus:bg-accent/10 focus:text-accent invalid:text-gray-400"
            >
              <option value="">Select...</option>
              {["Option A", "Option B", "Option C"].map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Field 3 (Date)</label>
            <input
              type="date"
              value={d.field3Date}
              onChange={(e) => set({ field3Date: e.target.value })}
              required
              className="w-full rounded-md border px-2 py-1.5 text-sm outline-none transition-colors hover:ring-1 hover:ring-border focus:ring-2 focus:ring-accent/50 focus:shadow-sm focus:bg-accent/10 focus:text-accent invalid:text-gray-400"
            />
          </div>
        </div>
        {/* Checklist */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-500">Checklist</label>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              onClick={() => onUpdateData((prev) => {
                const wd = prev as WorkData;
                const next = [
                  ...(wd.checklist ?? []),
                  { id: `c${Date.now()}`, text: "", done: false, proposed: false },
                ];
                return { ...wd, checklist: next } as WorkData;
              })}
            >
              <Plus className="h-3.5 w-3.5" />
              Add new
            </button>
          </div>
          <div className="space-y-2">
            {(!d.checklist || d.checklist.length === 0) && (
              <div className="grid place-items-center py-1.75 text-xs text-muted-foreground text-pretty">
                Nothing here yet. Add a checklist item to get started.
              </div>
            )}
            {(d.checklist ?? []).map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!c.done}
                  onChange={(e) => onUpdateData((prev) => {
                    const wd = prev as WorkData;
                    const next = (wd.checklist ?? []).map((it) => it.id === c.id ? { ...it, done: e.target.checked } : it);
                    return { ...wd, checklist: next } as WorkData;
                  })}
                  className="h-4 w-4"
                />
                <input
                  value={c.text}
                  placeholder="Checklist item"
                  onChange={(e) => onUpdateData((prev) => {
                    const wd = prev as WorkData;
                    const next = (wd.checklist ?? []).map((it) => it.id === c.id ? { ...it, text: e.target.value } : it);
                    return { ...wd, checklist: next } as WorkData;
                  })}
                  className="flex-1 rounded-md border px-2 py-1 text-sm outline-none transition-colors placeholder:text-gray-400 hover:ring-1 hover:ring-border focus:ring-2 focus:ring-accent/50 focus:bg-accent/10 focus:text-accent focus:placeholder:text-accent/65"
                />
                <button
                  type="button"
                  aria-label="Delete checklist item"
                  className="text-gray-400 hover:text-accent"
                  onClick={() => onUpdateData((prev) => {
                    const wd = prev as WorkData;
                    const next = (wd.checklist ?? []).filter((it) => it.id != c.id);
                    return { ...wd, checklist: next } as WorkData;
                  })}
                >
                  <X className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Entity card
  const e = item.data as EntityData;
  const setEntity = (partial: Partial<EntityData>) => onUpdateData((prev) => ({ ...(prev as EntityData), ...partial }));
  return (
    <div className="mt-4">
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-gray-500">Field 1</label>
        <input
          value={e.field1}
          onChange={(ev) => setEntity({ field1: ev.target.value })}
          className="w-full rounded-md border px-2 py-1.5 text-sm outline-none transition-colors placeholder:text-gray-400 hover:ring-1 hover:ring-border focus:ring-2 focus:ring-accent/50 focus:shadow-sm focus:bg-accent/10 focus:text-accent focus:placeholder:text-accent/65"
          placeholder="Field 1 value"
        />
      </div>
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-gray-500">Field 2</label>
        <select
          value={e.field2}
          onChange={(ev) => setEntity({ field2: ev.target.value })}
          required
          className="w-full rounded-md border px-2 py-1.5 text-sm outline-none transition-colors hover:ring-1 hover:ring-border focus:ring-2 focus:ring-accent/50 focus:shadow-sm focus:bg-accent/10 focus:text-accent invalid:text-gray-400"
        >
          <option value="">Select...</option>
          {["Option A", "Option B", "Option C"].map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-gray-500">Tags</label>
        <div className="flex flex-wrap gap-2">
          {(e.tagsAvailable ?? []).map((t) => {
            const active = (e.tags ?? []).includes(t);
            return (
              <button
                key={t}
                onClick={() => onToggleTag(t)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                  active ? "bg-accent/20 border-accent text-accent" : "text-gray-600"
                )}
              >
                {t}
              </button>
            );
          })}
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
