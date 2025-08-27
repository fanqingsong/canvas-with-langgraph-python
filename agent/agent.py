"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

from typing import Any, List, Optional, Dict
from typing_extensions import Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.types import Command
from copilotkit import CopilotKitState
from langgraph.prebuilt import ToolNode

class AgentState(CopilotKitState):
    """
    Here we define the state of the agent

    In this instance, we're inheriting from CopilotKitState, which will bring in
    the CopilotKitState fields. We're also adding a custom field, `language`,
    which will be used to set the language of the agent.
    """
    proverbs: List[str] = []
    tools: List[Any] = []
    # Shared state fields synchronized with the frontend (AG-UI Canvas)
    projects: List[Dict[str, Any]] = []
    activeProjectId: Optional[str] = None
def summarize_projects_for_prompt(state: AgentState) -> str:
    try:
        projects = state.get("projects", []) or []
        active_id = state.get("activeProjectId", None)
        lines: List[str] = []
        for p in projects:
            pid = p.get("id", "")
            mark = " (active)" if pid == active_id else ""
            name = p.get("name", "")
            wi = p.get("workItem", {}) or {}
            owner = (wi.get("owner", {}) or {}).get("name", "")
            status = wi.get("status", "")
            due = wi.get("dueDate", "")
            tags = ", ".join(wi.get("tags", []) or [])
            lines.append(f"id={pid}{mark} · name={name} · owner={owner} · status={status} · due={due} · tags=[{tags}]")
        return "\n".join(lines) if lines else "(no projects)"
    except Exception:
        return "(unable to summarize projects)"


@tool
def get_weather(location: str):
    """
    Get the weather for a given location.
    """
    return f"The weather for {location} is 70 degrees."

# @tool
# def your_tool_here(your_arg: str):
#     """Your tool description here."""
#     print(f"Your tool logic here")
#     return "Your tool response here."

backend_tools = [
    get_weather
    # your_tool_here
]

# Extract tool names from backend_tools for comparison
backend_tool_names = [tool.name for tool in backend_tools]


async def chat_node(state: AgentState, config: RunnableConfig) -> Command[Literal["tool_node", "__end__"]]:
    """
    Standard chat node based on the ReAct design pattern. It handles:
    - The model to use (and binds in CopilotKit actions and the tools defined above)
    - The system prompt
    - Getting a response from the model
    - Handling tool calls

    For more about the ReAct design pattern, see:
    https://www.perplexity.ai/search/react-agents-NcXLQhreS0WDzpVaS4m9Cg
    """

    # 1. Define the model
    model = ChatOpenAI(model="gpt-4o")

    # 2. Bind the tools to the model
    model_with_tools = model.bind_tools(
        [
            *state.get("tools", []), # bind tools defined by ag-ui
            *backend_tools,
            # your_tool_here
        ],

        # 2.1 Disable parallel tool calls to avoid race conditions,
        #     enable this for faster performance if you want to manage
        #     the complexity of running tool calls in parallel.
        parallel_tool_calls=False,
    )

    # 3. Define the system message by which the chat model will be run
    projects_summary = summarize_projects_for_prompt(state)
    system_message = SystemMessage(
        content=(
            "You are a helpful assistant for an AG-UI Canvas.\n"
            "You have shared state synchronized with the UI via CopilotKit CoAgents.\n"
            "Treat the values in the provided state as the single source of truth.\n"
            "Do not rely on prior assumptions; always read the latest 'projects' and 'activeProjectId' from state.\n"
            f"Active Project Id: {state.get('activeProjectId', None)}\n"
            f"Projects:\n{projects_summary}\n"
        )
    )

    # 4. Run the model to generate a response
    response = await model_with_tools.ainvoke([
        system_message,
        *state["messages"],
    ], config)

    # only route to tool node if tool is not in the tools list
    if route_to_tool_node(response):
        print("routing to tool node")
        return Command(
            goto="tool_node",
            update={
                "messages": [response],
                # persist shared state keys so UI edits survive across runs
                "projects": state.get("projects", []),
                "activeProjectId": state.get("activeProjectId", None),
            }
        )

    # 5. We've handled all tool calls, so we can end the graph.
    return Command(
        goto=END,
        update={
            "messages": [response],
            # persist shared state keys so UI edits survive across runs
            "projects": state.get("projects", []),
            "activeProjectId": state.get("activeProjectId", None),
        }
    )

def route_to_tool_node(response: BaseMessage):
    """
    Route to tool node if any tool call in the response matches a backend tool name.
    """
    tool_calls = getattr(response, "tool_calls", None)
    if not tool_calls:
        return False

    for tool_call in tool_calls:
        if tool_call.get("name") in backend_tool_names:
            return True
    return False

# Define the workflow graph
workflow = StateGraph(AgentState)
workflow.add_node("chat_node", chat_node)
workflow.add_node("tool_node", ToolNode(tools=backend_tools))
workflow.add_edge("tool_node", "chat_node")
workflow.set_entry_point("chat_node")

graph = workflow.compile()
