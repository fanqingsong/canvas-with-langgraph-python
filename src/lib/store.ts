import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"

export interface WorkItem {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  status: "todo" | "in-progress" | "completed"
  fields: Record<string, string>
  lastModified: Date
  createdBy: string
}

export interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  type?: "suggestion" | "action" | "normal"
}

interface AppState {
  // Project State
  projectName: string
  projectDescription: string
  updateProjectName: (name: string) => void
  updateProjectDescription: (description: string) => void

  // Work Item State
  workItems: WorkItem[]
  addWorkItem: (workItem: Omit<WorkItem, "id" | "lastModified">) => void
  removeWorkItem: (id: string) => void
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => void

  // Chat State
  messages: Message[]
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void
  isAITyping: boolean
  setAITyping: (typing: boolean) => void

  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Collaboration State
  isCollaborating: boolean
  collaborators: Array<{ id: string; name: string; type: "user" | "ai"; status: "active" | "idle" }>
  setCollaborating: (collaborating: boolean) => void
  updateCollaborator: (id: string, updates: Partial<{ status: "active" | "idle" }>) => void
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    projectName: "AI Canvas Development Project",
    projectDescription:
      "A collaborative workspace where humans and AI agents can work together on shared state in real-time. This project aims to create an intuitive interface that enables seamless collaboration between team members and AI assistants, allowing for dynamic work item management, real-time communication, and intelligent suggestions to enhance productivity and project outcomes.",

    updateProjectName: (name) => set({ projectName: name }),
    updateProjectDescription: (description) => set({ projectDescription: description }),

    // Initial Work Items
    workItems: [
      {
        id: "1",
        title: "Project Brief: AI Canvas Development",
        description: "Develop a collaborative workspace where humans and AI agents can work together in real-time.",
        priority: "high",
        status: "in-progress",
        fields: {
          "Project Owner": "Design Team",
          "Due Date": "2024-02-15",
          Budget: "$50,000",
          Stakeholders: "Product, Engineering, Design",
        },
        lastModified: new Date(),
        createdBy: "Design Team",
      },
      {
        id: "2",
        title: "User Research & Testing",
        description: "Conduct user interviews and usability testing for the new interface.",
        priority: "medium",
        status: "todo",
        fields: {
          "Project Owner": "UX Team",
          "Due Date": "2024-02-20",
          Budget: "$15,000",
          Stakeholders: "Product, Design",
        },
        lastModified: new Date(),
        createdBy: "UX Team",
      },
    ],

    addWorkItem: (workItemData) => {
      const newWorkItem: WorkItem = {
        ...workItemData,
        id: Date.now().toString(),
        lastModified: new Date(),
      }
      set((state) => ({ workItems: [...state.workItems, newWorkItem] }))
    },

    removeWorkItem: (id) => {
      set((state) => ({ workItems: state.workItems.filter((item) => item.id !== id) }))
    },

    updateWorkItem: (id, updates) => {
      set((state) => ({
        workItems: state.workItems.map((item) =>
          item.id === id ? { ...item, ...updates, lastModified: new Date() } : item,
        ),
      }))
    },

    // Initial Messages
    messages: [
      {
        id: "1",
        content:
          "Hello! I'm your AI assistant. I can help you manage work items, suggest improvements, and collaborate on tasks. How can I assist you today?",
        sender: "ai",
        timestamp: new Date(Date.now() - 300000),
        type: "normal",
      },
      {
        id: "2",
        content:
          "I notice you're working on the AI Canvas project. Would you like me to suggest some priority adjustments based on the current timeline?",
        sender: "ai",
        timestamp: new Date(Date.now() - 120000),
        type: "suggestion",
      },
    ],

    addMessage: (messageData) => {
      const message: Message = {
        ...messageData,
        id: Date.now().toString(),
        timestamp: new Date(),
      }

      set((state) => ({ messages: [...state.messages, message] }))
    },

    isAITyping: false,
    setAITyping: (typing) => set({ isAITyping: typing }),

    // UI State
    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    // Collaboration State
    isCollaborating: true,
    collaborators: [
      { id: "user-1", name: "Design Team", type: "user", status: "active" },
      { id: "ai-1", name: "AI Assistant", type: "ai", status: "active" },
    ],
    setCollaborating: (collaborating) => set({ isCollaborating: collaborating }),
    updateCollaborator: (id, updates) => {
      set((state) => ({
        collaborators: state.collaborators.map((collab) => (collab.id === id ? { ...collab, ...updates } : collab)),
      }))
    },
  })),
)

useAppStore.subscribe(
  (state) => state.workItems,
  (workItems, previousWorkItems) => {
    // Simulate AI suggestions based on work item changes
    if (
      workItems.length !== previousWorkItems.length ||
      workItems.some((item, index) => item.lastModified !== previousWorkItems[index]?.lastModified)
    ) {
      setTimeout(() => {
        const suggestions = [
          "I notice you updated a work item. Would you like me to analyze the impact on the timeline?",
          "Based on the changes, I recommend reviewing the stakeholder list to ensure all relevant parties are included.",
          "The priority change looks good. Should I suggest some next steps for the implementation phase?",
        ]

        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]

        useAppStore.getState().addMessage({
          content: randomSuggestion,
          sender: "ai",
          type: "suggestion",
        })
      }, 2000)
    }
  },
)
