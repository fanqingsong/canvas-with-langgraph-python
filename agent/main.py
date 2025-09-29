"""
FastAPI 应用主文件
提供 LangGraph Agent 的 HTTP 接口
"""

import os
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import json

# 导入 agent
from agent import create_agent

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

# 全局 agent 实例
agent = None

class AgentRequest(BaseModel):
    """Agent 请求模型"""
    message: str
    thread_id: str = None
    user_id: str = "default_user"

class AgentResponse(BaseModel):
    """Agent 响应模型"""
    response: str
    thread_id: str
    status: str = "success"

@app.on_event("startup")
async def startup_event():
    """应用启动时初始化 agent"""
    global agent
    try:
        print("🚀 正在初始化 LangGraph Agent...")
        agent = create_agent()
        print("✅ LangGraph Agent 初始化成功!")
    except Exception as e:
        print(f"❌ Agent 初始化失败: {str(e)}")
        # 即使初始化失败，也继续启动服务，但会在请求时返回错误

@app.get("/")
async def root():
    """根路径健康检查"""
    return {
        "message": "LangGraph Agent API is running",
        "status": "healthy",
        "agent_ready": agent is not None
    }

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "agent_ready": agent is not None,
        "version": "1.0.0"
    }

@app.post("/agent/invoke", response_model=AgentResponse)
async def invoke_agent(request: AgentRequest):
    """调用 agent 处理请求"""
    if agent is None:
        raise HTTPException(
            status_code=503, 
            detail="Agent is not initialized. Please check the logs."
        )
    
    try:
        # 准备输入
        inputs = {
            "messages": [{"role": "user", "content": request.message}],
            "thread_id": request.thread_id or "default_thread"
        }
        
        # 调用 agent
        result = await agent.ainvoke(inputs)
        
        # 提取响应
        if isinstance(result, dict) and "messages" in result:
            # 获取最后一条消息
            messages = result["messages"]
            if messages:
                last_message = messages[-1]
                if isinstance(last_message, dict):
                    response_text = last_message.get("content", "No response generated")
                else:
                    response_text = str(last_message)
            else:
                response_text = "No response generated"
        else:
            response_text = str(result)
        
        return AgentResponse(
            response=response_text,
            thread_id=request.thread_id or "default_thread",
            status="success"
        )
        
    except Exception as e:
        print(f"❌ Agent 调用失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Agent execution failed: {str(e)}"
        )

# LangGraph 兼容的端点
@app.post("/runs/{thread_id}/stream")
async def langgraph_stream(thread_id: str, request: dict):
    """LangGraph 流式端点"""
    if agent is None:
        raise HTTPException(
            status_code=503, 
            detail="Agent is not initialized. Please check the logs."
        )
    
    try:
        # 从请求中提取消息
        messages = request.get("input", {}).get("messages", [])
        if not messages:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        # 准备输入
        inputs = {
            "messages": messages,
            "thread_id": thread_id
        }
        
        # 流式调用 agent
        async def generate():
            async for chunk in agent.astream(inputs):
                yield f"data: {json.dumps(chunk)}\n\n"
            yield "data: [DONE]\n\n"
        
        from fastapi.responses import StreamingResponse
        return StreamingResponse(generate(), media_type="text/plain")
        
    except Exception as e:
        print(f"❌ LangGraph 流式调用失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"LangGraph stream failed: {str(e)}"
        )

@app.post("/runs/{thread_id}/invoke")
async def langgraph_invoke(thread_id: str, request: dict):
    """LangGraph 同步调用端点"""
    if agent is None:
        raise HTTPException(
            status_code=503, 
            detail="Agent is not initialized. Please check the logs."
        )
    
    try:
        # 从请求中提取消息
        messages = request.get("input", {}).get("messages", [])
        if not messages:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        # 准备输入
        inputs = {
            "messages": messages,
            "thread_id": thread_id
        }
        
        # 调用 agent
        result = await agent.ainvoke(inputs)
        
        return {
            "output": result,
            "run_id": f"run_{thread_id}_{hash(str(result))}",
            "status": "success"
        }
        
    except Exception as e:
        print(f"❌ LangGraph 调用失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"LangGraph invoke failed: {str(e)}"
        )

@app.post("/agent/stream")
async def stream_agent(request: AgentRequest):
    """流式调用 agent（用于实时响应）"""
    if agent is None:
        raise HTTPException(
            status_code=503, 
            detail="Agent is not initialized. Please check the logs."
        )
    
    try:
        # 准备输入
        inputs = {
            "messages": [{"role": "user", "content": request.message}],
            "thread_id": request.thread_id or "default_thread"
        }
        
        # 流式调用 agent
        async for chunk in agent.astream(inputs):
            yield f"data: {json.dumps(chunk)}\n\n"
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        print(f"❌ Agent 流式调用失败: {str(e)}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

@app.get("/agent/tools")
async def get_agent_tools():
    """获取 agent 可用的工具列表"""
    if agent is None:
        return {"tools": [], "error": "Agent not initialized"}
    
    try:
        # 获取 agent 的工具信息
        tools = []
        if hasattr(agent, 'tools'):
            for tool in agent.tools:
                tools.append({
                    "name": getattr(tool, 'name', 'unknown'),
                    "description": getattr(tool, 'description', 'No description')
                })
        
        return {"tools": tools}
    except Exception as e:
        return {"tools": [], "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8123)
