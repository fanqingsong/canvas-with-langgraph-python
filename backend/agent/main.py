"""
FastAPI 应用主文件
提供 LangGraph Agent 的 HTTP 接口
使用 CopilotKit 官方集成方式
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from copilotkit import LangGraphAGUIAgent 
from ag_ui_langgraph import add_langgraph_fastapi_endpoint 
from agent import graph  # 导入 graph 对象
from dotenv import load_dotenv

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

# 使用 CopilotKit 官方集成方式添加 LangGraph 端点
add_langgraph_fastapi_endpoint(
    app=app,
    agent=LangGraphAGUIAgent(
        name="sample_agent",  # 在 langgraph.json 中定义的 agent 名称
        description="Canvas with LangGraph Python Agent - 一个强大的AI助手，可以处理各种任务",
        graph=graph,  # 从 agent 模块导入的 graph 对象
    ),
    path="/",  # 服务 agent 的端点路径 - 根路径
)

# 健康检查端点
@app.get("/health")
def health():
    """健康检查"""
    return {"status": "ok", "message": "LangGraph Agent API is running"}

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