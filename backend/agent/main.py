"""
FastAPI 应用主文件
提供 LangGraph Agent 的 HTTP 接口
使用 CopilotKit 官方集成方式
"""

import os
import time
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from copilotkit import LangGraphAGUIAgent 
from ag_ui_langgraph import add_langgraph_fastapi_endpoint 
from agent import graph  # 导入 graph 对象
from dotenv import load_dotenv
from auth import get_current_user, User, Permission, require_permission, has_permission
from auth_routes import router as auth_router
from authenticated_agent import AuthenticatedLangGraphAgent, AuthenticatedLangGraphAgentFactory

# 加载环境变量
load_dotenv()

app = FastAPI(
    title="LangGraph Agent API",
    description="Canvas with LangGraph Python Agent API",
    version="1.0.0"
)

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册认证路由
app.include_router(auth_router)

# 创建带权限检查的 LangGraph 端点
def create_authenticated_agent(user: User):
    """为认证用户创建 Agent"""
    from permission_agent import create_permission_aware_agent
    return create_permission_aware_agent(user)

# 创建带权限校验的 LangGraph 端点
@app.post("/")
async def langgraph_endpoint(
    request_data: dict,
    current_user: User = Depends(get_current_user)
):
    """带权限校验的 LangGraph 端点"""
    from permission_agent import get_available_tools_for_user
    
    # 处理请求
    try:
        # 这里需要根据 LangGraph 的接口来处理请求
        # 暂时返回一个简单的响应
        return {
            "message": f"Hello {current_user.username}! You have access to the LangGraph agent.",
            "user_role": current_user.role.value,
            "available_tools": get_available_tools_for_user(current_user)
        }
    except Exception as e:
        return {"error": str(e)}

# 使用带鉴权Agent的LangGraph端点
@app.post("/langgraph-agent")
async def authenticated_langgraph_endpoint(
    request_data: dict,
    current_user: User = Depends(get_current_user)
):
    """使用带鉴权Agent包装器的LangGraph端点"""
    try:
        # 创建带鉴权的Agent
        agent = AuthenticatedLangGraphAgentFactory.create_agent(current_user, "default")
        
        # 调用Agent
        result = await agent.invoke(request_data)
        
        return {
            "message": f"Agent executed successfully for user {current_user.username}",
            "user_info": agent.get_user_info(),
            "result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {"error": f"Agent execution failed: {str(e)}"}

# 管理员级别的LangGraph端点
@app.post("/langgraph/admin")
async def admin_langgraph_endpoint(
    request_data: dict,
    current_user: User = Depends(require_permission(Permission.WRITE_CANVAS))
):
    """管理员级别的LangGraph端点"""
    try:
        # 创建管理员级别的Agent
        agent = AuthenticatedLangGraphAgentFactory.create_agent(current_user, "admin")
        
        # 调用Agent
        result = await agent.invoke(request_data)
        
        return {
            "message": f"Admin agent executed successfully for user {current_user.username}",
            "user_info": agent.get_user_info(),
            "result": result,
            "admin_operations": "available"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {"error": f"Admin agent execution failed: {str(e)}"}

# 只读级别的LangGraph端点
@app.post("/langgraph/readonly")
async def readonly_langgraph_endpoint(
    request_data: dict,
    current_user: User = Depends(require_permission(Permission.READ_CANVAS))
):
    """只读级别的LangGraph端点"""
    try:
        # 创建只读级别的Agent
        agent = AuthenticatedLangGraphAgentFactory.create_agent(current_user, "readonly")
        
        # 调用Agent
        result = await agent.invoke(request_data)
        
        return {
            "message": f"Readonly agent executed successfully for user {current_user.username}",
            "user_info": agent.get_user_info(),
            "result": result,
            "readonly_mode": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {"error": f"Readonly agent execution failed: {str(e)}"}

# 获取用户Agent信息的端点
@app.get("/langgraph/user-info")
async def get_user_agent_info(
    current_user: User = Depends(get_current_user)
):
    """获取用户Agent信息"""
    try:
        # 创建带鉴权的Agent
        agent = AuthenticatedLangGraphAgentFactory.create_agent(current_user, "default")
        
        return {
            "user_info": agent.get_user_info(),
            "available_endpoints": [
                "/langgraph - 默认Agent",
                "/langgraph/admin - 管理员Agent", 
                "/langgraph/readonly - 只读Agent"
            ]
        }
        
    except Exception as e:
        return {"error": f"Failed to get user agent info: {str(e)}"}

# 自定义的LangGraph端点，支持认证
@app.post("/langgraph-dev")
async def custom_langgraph_endpoint(
    request_data: dict,
    current_user: User = Depends(get_current_user)
):
    """自定义LangGraph端点，支持认证"""
    try:
        print(f"[CUSTOM_LANGGRAPH] 用户 {current_user.username} 调用LangGraph端点")
        print(f"[CUSTOM_LANGGRAPH] 请求数据: {request_data}")
        
        # 将用户信息添加到请求数据中
        enhanced_request_data = {
            **request_data,
            "user_info": {
                "username": current_user.username,
                "role": current_user.role.value,
                "permissions": [p.value for p in current_user.permissions],
                "user_id": current_user.id
            }
        }
        
        # 调用LangGraph
        thread_id = request_data.get("threadId", f"thread-{current_user.username}-{int(time.time())}")
        result = await graph.ainvoke(enhanced_request_data, config={
            "configurable": {
                "thread_id": thread_id,
                "authorization": f"Bearer {current_user.username}",  # 临时使用username作为token
                "user_info": {
                    "username": current_user.username,
                    "role": current_user.role.value,
                    "permissions": [p.value for p in current_user.permissions],
                    "user_id": current_user.id
                }
            }
        })
        
        return result
        
    except Exception as e:
        print(f"[CUSTOM_LANGGRAPH] 错误: {e}")
        import traceback
        traceback.print_exc()
        return {"error": f"LangGraph execution failed: {str(e)}"}

# 保留原始的 CopilotKit 集成方式（无权限校验，用于开发测试）
# 在生产环境中应该禁用或添加额外的安全措施
# if os.getenv("ENVIRONMENT") != "production":
add_langgraph_fastapi_endpoint(
    app=app,
    agent=LangGraphAGUIAgent(
        name="sample_agent_dev",  # 开发版本
        description="Canvas with LangGraph Python Agent - 开发版本（无权限校验）",
        graph=graph,  # 从 agent 模块导入的 graph 对象
    ),
    path="/langgraph",  # 改为开发端点路径，避免冲突
)

# 健康检查端点
@app.get("/health")
def health():
    """健康检查"""
    return {"status": "ok", "message": "LangGraph Agent API is running with volume mount hot reload"}

# 权限相关端点
@app.get("/permissions/check")
async def check_permissions(current_user: User = Depends(get_current_user)):
    """检查当前用户权限"""
    from permission_agent import get_available_tools_for_user, get_user_permissions
    
    return {
        "user": {
            "username": current_user.username,
            "role": current_user.role.value,
            "permissions": get_user_permissions(current_user)
        },
        "available_tools": get_available_tools_for_user(current_user)
    }

@app.get("/permissions/tools")
async def get_tool_permissions(current_user: User = Depends(get_current_user)):
    """获取工具权限映射"""
    from permission_agent import PermissionAwareAgent
    from agent import graph as original_graph
    
    permission_agent = PermissionAwareAgent(original_graph)
    tool_permissions = {}
    
    for tool_name, permission in permission_agent.permission_tool_mapping.items():
        tool_permissions[tool_name] = {
            "required_permission": permission.value,
            "has_permission": has_permission(current_user, permission)
        }
    
    return tool_permissions

# 根路径现在被 LangGraph 端点占用

def main():
    """运行 uvicorn 服务器"""
    port = int(os.getenv("PORT", "8123"))
    uvicorn.run(
        "main:app",  # 当前文件的路径
        host="0.0.0.0",
        port=port,
        reload=True,
    )

if __name__ == "__main__":
    main()