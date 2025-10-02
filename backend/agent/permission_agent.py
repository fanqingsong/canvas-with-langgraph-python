"""
带权限检查的 LangGraph Agent 包装器
根据用户权限限制工具访问和功能使用
"""

from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.tools import BaseTool

from auth import User, Permission, has_permission
from agent import AgentState
from langgraph.prebuilt import ToolNode

class PermissionAwareAgent:
    """带权限检查的 Agent 包装器"""
    
    def __init__(self, original_graph: StateGraph):
        self.original_graph = original_graph
        self.permission_tool_mapping = self._create_permission_mapping()
    
    def _create_permission_mapping(self) -> Dict[str, Permission]:
        """创建工具到权限的映射"""
        return {
            # 基础画布操作
            "setGlobalTitle": Permission.WRITE_CANVAS,
            "setGlobalDescription": Permission.WRITE_CANVAS,
            "setItemName": Permission.WRITE_CANVAS,
            "setItemSubtitleOrDescription": Permission.WRITE_CANVAS,
            "createItem": Permission.WRITE_CANVAS,
            "deleteItem": Permission.DELETE_CANVAS,
            
            # 项目管理
            "setProjectField1": Permission.EDIT_PROJECT,
            "setProjectField2": Permission.EDIT_PROJECT,
            "setProjectField3": Permission.EDIT_PROJECT,
            "clearProjectField3": Permission.EDIT_PROJECT,
            "addProjectChecklistItem": Permission.EDIT_PROJECT,
            "setProjectChecklistItem": Permission.EDIT_PROJECT,
            "removeProjectChecklistItem": Permission.EDIT_PROJECT,
            
            # 实体管理
            "setEntityField1": Permission.EDIT_ENTITY,
            "setEntityField2": Permission.EDIT_ENTITY,
            "addEntityField3": Permission.EDIT_ENTITY,
            "removeEntityField3": Permission.EDIT_ENTITY,
            
            # 笔记管理
            "setNoteField1": Permission.EDIT_NOTE,
            "appendNoteField1": Permission.EDIT_NOTE,
            "clearNoteField1": Permission.EDIT_NOTE,
            
            # 图表管理
            "addChartField1": Permission.EDIT_CHART,
            "setChartField1Label": Permission.EDIT_CHART,
            "setChartField1Value": Permission.EDIT_CHART,
            "clearChartField1Value": Permission.EDIT_CHART,
            "removeChartField1": Permission.EDIT_CHART,
            
            # 计划管理
            "set_plan": Permission.CREATE_PLAN,
            "update_plan_progress": Permission.EXECUTE_PLAN,
            "complete_plan": Permission.MANAGE_PLAN,
        }
    
    def filter_tools_by_permission(self, tools: List[BaseTool], user: User) -> List[BaseTool]:
        """根据用户权限过滤工具"""
        filtered_tools = []
        for tool in tools:
            tool_name = tool.name
            required_permission = self.permission_tool_mapping.get(tool_name)
            
            if required_permission is None:
                # 没有权限要求的工具，默认允许
                filtered_tools.append(tool)
            elif has_permission(user, required_permission):
                # 用户有权限，添加工具
                filtered_tools.append(tool)
            # 没有权限的工具被过滤掉
        
        return filtered_tools
    
    def create_permission_aware_chat_node(self, user: User):
        """创建带权限检查的聊天节点"""
        from agent import chat_node
        
        async def permission_chat_node(state: AgentState, config: Dict[str, Any]) -> Any:
            # 获取原始聊天节点的结果
            result = await chat_node(state, config)
            
            # 如果结果是工具调用，检查权限
            if hasattr(result, 'tool_calls') and result.tool_calls:
                filtered_tool_calls = []
                for tool_call in result.tool_calls:
                    tool_name = tool_call.get('name', '')
                    required_permission = self.permission_tool_mapping.get(tool_name)
                    
                    if required_permission is None or has_permission(user, required_permission):
                        filtered_tool_calls.append(tool_call)
                    else:
                        # 添加权限不足的消息
                        filtered_tool_calls.append({
                            'name': 'permission_denied',
                            'args': {
                                'tool_name': tool_name,
                                'required_permission': required_permission.value,
                                'message': f'权限不足：需要 {required_permission.value} 权限才能使用 {tool_name} 工具'
                            }
                        })
                
                result.tool_calls = filtered_tool_calls
            
            return result
        
        return permission_chat_node
    
    def create_permission_aware_tool_node(self, user: User):
        """创建带权限检查的工具节点"""
        from langgraph.prebuilt import ToolNode
        from agent import tools
        
        # 创建工具节点
        tool_node = ToolNode(tools)
        
        async def permission_tool_node(state: AgentState, config: Dict[str, Any]) -> Any:
            # 获取原始工具节点的结果
            result = await tool_node.ainvoke(state, config)
            
            # 检查是否有权限不足的工具调用
            if hasattr(result, 'messages') and result.messages:
                for message in result.messages:
                    if hasattr(message, 'tool_calls'):
                        for tool_call in message.tool_calls:
                            if tool_call.get('name') == 'permission_denied':
                                # 替换为权限不足的消息
                                message.content = tool_call['args']['message']
                                message.tool_calls = []
            
            return result
        
        return permission_tool_node
    
    def create_user_specific_graph(self, user: User) -> StateGraph:
        """为用户创建特定的图"""
        # 创建新的图实例
        graph = StateGraph(AgentState)
        
        # 添加带权限检查的节点
        graph.add_node("chat", self.create_permission_aware_chat_node(user))
        graph.add_node("tools", self.create_permission_aware_tool_node(user))
        
        # 添加边
        graph.add_edge("chat", "tools")
        graph.add_edge("tools", "chat")
        
        # 设置入口点
        graph.set_entry_point("chat")
        
        return graph.compile()

def create_permission_aware_agent(user: User) -> StateGraph:
    """为特定用户创建带权限检查的 Agent"""
    from agent import graph as original_graph
    permission_agent = PermissionAwareAgent(original_graph)
    return permission_agent.create_user_specific_graph(user)

# 权限检查装饰器
def check_permission(permission: Permission):
    """权限检查装饰器"""
    def decorator(func):
        def wrapper(user: User, *args, **kwargs):
            if not has_permission(user, permission):
                raise PermissionError(f"权限不足：需要 {permission.value} 权限")
            return func(user, *args, **kwargs)
        return wrapper
    return decorator

# 权限相关的工具
def get_user_permissions(user: User) -> List[str]:
    """获取用户权限列表"""
    return [permission.value for permission in user.permissions]

def can_access_tool(user: User, tool_name: str) -> bool:
    """检查用户是否可以访问特定工具"""
    from agent import graph as original_graph
    permission_agent = PermissionAwareAgent(original_graph)
    required_permission = permission_agent.permission_tool_mapping.get(tool_name)
    
    if required_permission is None:
        return True  # 没有权限要求的工具默认允许
    
    return has_permission(user, required_permission)

def get_available_tools_for_user(user: User) -> List[str]:
    """获取用户可用的工具列表"""
    from agent import graph as original_graph
    permission_agent = PermissionAwareAgent(original_graph)
    available_tools = []
    
    for tool_name, required_permission in permission_agent.permission_tool_mapping.items():
        if has_permission(user, required_permission):
            available_tools.append(tool_name)
    
    return available_tools
