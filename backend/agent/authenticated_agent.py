"""
带鉴权的LangGraph Agent包装器
在Agent层面实现权限控制，而不是在HTTP端点层面
"""

from typing import Dict, Any, Optional, List
from langgraph.graph import StateGraph
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.tools import BaseTool
from fastapi import HTTPException, status
from auth import User, Permission, has_permission
from agent import graph as original_graph


class AuthenticatedLangGraphAgent:
    """带鉴权的LangGraph Agent包装器"""
    
    def __init__(self, user: User, required_permissions: List[Permission] = None):
        """
        初始化带鉴权的Agent
        
        Args:
            user: 当前用户
            required_permissions: 需要的权限列表，默认为READ_CANVAS
        """
        self.user = user
        self.required_permissions = required_permissions or [Permission.READ_CANVAS]
        self.original_graph = original_graph
        
        # 根据用户权限过滤可用的工具
        self.filtered_tools = self._filter_tools_by_permissions()
        
    def _filter_tools_by_permissions(self) -> List[BaseTool]:
        """根据用户权限过滤可用的工具"""
        from permission_agent import PermissionAwareAgent
        
        permission_agent = PermissionAwareAgent(self.original_graph)
        available_tools = []
        
        for tool_name, permission in permission_agent.permission_tool_mapping.items():
            if has_permission(self.user, permission):
                # 这里需要根据实际的工具获取方式来获取工具对象
                # 暂时返回工具名称，实际实现需要获取工具对象
                available_tools.append(tool_name)
        
        return available_tools
    
    def _check_permissions(self):
        """检查用户是否有必要的权限"""
        for permission in self.required_permissions:
            if not has_permission(self.user, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"权限不足：需要 {permission.value} 权限"
                )
    
    async def invoke(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        调用LangGraph Agent，带权限检查
        
        Args:
            input_data: 输入数据
            
        Returns:
            Agent执行结果
        """
        # 检查权限
        self._check_permissions()
        
        # 记录用户操作日志
        self._log_user_action(input_data)
        
        try:
            # 调用原始graph
            result = await self.original_graph.ainvoke(input_data)
            
            # 记录成功操作
            self._log_success_action(input_data, result)
            
            return result
            
        except Exception as e:
            # 记录错误操作
            self._log_error_action(input_data, e)
            raise
    
    def _log_user_action(self, input_data: Dict[str, Any]):
        """记录用户操作日志"""
        print(f"[AUTH_AGENT] User {self.user.username} (role: {self.user.role.value}) "
              f"invoking agent with permissions: {[p.value for p in self.user.permissions]}")
        print(f"[AUTH_AGENT] Input data keys: {list(input_data.keys())}")
    
    def _log_success_action(self, input_data: Dict[str, Any], result: Dict[str, Any]):
        """记录成功操作日志"""
        print(f"[AUTH_AGENT] Success: User {self.user.username} completed agent invocation")
    
    def _log_error_action(self, input_data: Dict[str, Any], error: Exception):
        """记录错误操作日志"""
        print(f"[AUTH_AGENT] Error: User {self.user.username} failed agent invocation: {str(error)}")
    
    def get_available_tools(self) -> List[str]:
        """获取用户可用的工具列表"""
        return self.filtered_tools
    
    def get_user_info(self) -> Dict[str, Any]:
        """获取用户信息"""
        return {
            "username": self.user.username,
            "role": self.user.role.value,
            "permissions": [p.value for p in self.user.permissions],
            "available_tools": self.get_available_tools()
        }


class AuthenticatedLangGraphAgentFactory:
    """带鉴权的LangGraph Agent工厂类"""
    
    @staticmethod
    def create_agent(user: User, agent_type: str = "default") -> AuthenticatedLangGraphAgent:
        """
        根据用户和类型创建带鉴权的Agent
        
        Args:
            user: 当前用户
            agent_type: Agent类型 (default, admin, readonly)
            
        Returns:
            带鉴权的Agent实例
        """
        if agent_type == "admin":
            required_permissions = [
                Permission.READ_CANVAS,
                Permission.WRITE_CANVAS,
                Permission.DELETE_CANVAS
            ]
        elif agent_type == "readonly":
            required_permissions = [Permission.READ_CANVAS]
        else:  # default
            required_permissions = [Permission.READ_CANVAS]
        
        return AuthenticatedLangGraphAgent(user, required_permissions)


# 权限检查装饰器
def require_agent_permissions(permissions: List[Permission]):
    """Agent权限检查装饰器"""
    def decorator(func):
        async def wrapper(self, *args, **kwargs):
            # 检查权限
            for permission in permissions:
                if not has_permission(self.user, permission):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"权限不足：需要 {permission.value} 权限"
                    )
            return await func(self, *args, **kwargs)
        return wrapper
    return decorator


# 使用示例
async def example_usage():
    """使用示例"""
    from auth import get_user
    
    # 获取用户
    user = get_user("admin")
    
    # 创建带鉴权的Agent
    agent = AuthenticatedLangGraphAgentFactory.create_agent(user, "admin")
    
    # 调用Agent
    result = await agent.invoke({
        "messages": [HumanMessage(content="Hello, I need help with my project")]
    })
    
    print("Agent result:", result)
    print("User info:", agent.get_user_info())
