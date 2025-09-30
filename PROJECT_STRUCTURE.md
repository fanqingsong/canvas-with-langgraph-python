# 项目结构说明

## 整体结构
```
canvas-with-langgraph-python/
├── frontend/                    # 前端服务 (Next.js + CopilotKit)
│   ├── src/                    # 前端源代码
│   ├── public/                 # 静态资源
│   ├── package.json            # 前端依赖配置
│   ├── next.config.ts          # Next.js 配置
│   ├── tailwind.config.js      # Tailwind CSS 配置
│   ├── tsconfig.json           # TypeScript 配置
│   ├── Dockerfile.frontend     # 前端 Docker 配置
│   └── scripts/                # 前端构建脚本
├── backend/                    # 后端服务 (Python LangGraph)
│   ├── agent/                  # LangGraph Agent 代码
│   │   ├── main.py            # FastAPI 主服务
│   │   ├── agent.py           # LangGraph Agent 定义
│   │   ├── langgraph.json     # LangGraph 配置
│   │   └── requirements.txt   # Python 依赖
│   ├── test_azure_openai.py   # 测试脚本
│   └── Dockerfile.backend     # 后端 Docker 配置
├── docker-compose.yml          # Docker Compose 配置
├── .env.example               # 环境变量示例
└── README.md                  # 项目说明
```

## 服务说明

### 前端服务 (frontend/)
- **技术栈**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **AI 集成**: CopilotKit 1.10.4
- **端口**: 3000
- **功能**: Canvas UI + AI 聊天界面

### 后端服务 (backend/)
- **技术栈**: Python 3.12 + FastAPI + LangGraph
- **AI 集成**: LangChain + OpenAI/Azure OpenAI
- **端口**: 8123
- **功能**: LangGraph Agent API

## 环境变量

### 前端环境变量
- `NEXT_PUBLIC_AGENT_URL`: 后端服务地址 (默认: http://backend:8123)
- `LANGGRAPH_URL`: LangGraph 服务地址 (默认: http://backend:8123)
- `COPILOT_CLOUD_PUBLIC_API_KEY`: CopilotKit 云服务 API Key

### 后端环境变量
- `OPENAI_API_KEY`: OpenAI API Key
- `AZURE_OPENAI_API_KEY`: Azure OpenAI API Key
- `AZURE_OPENAI_ENDPOINT`: Azure OpenAI 端点
- `AZURE_OPENAI_DEPLOYMENT_NAME`: Azure OpenAI 部署名称
- `AZURE_OPENAI_API_VERSION`: Azure OpenAI API 版本

## 启动方式

### 生产环境 (推荐)
```bash
# 构建并启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 开发环境 (带热加载)
```bash
# 方式1: 使用 watch 模式 (文件变化时重建容器)
./dev.sh

# 方式2: 使用文件同步模式 (文件变化时同步到容器，更快)
./dev-sync.sh

# 手动启动开发模式
docker compose -f docker-compose.dev.yml watch
```

### 本地开发 (不使用 Docker)
```bash
# 启动后端服务
cd backend
python -m uvicorn agent.main:app --host 0.0.0.0 --port 8123

# 启动前端服务
cd frontend
npm run dev
```

## 热加载功能

### 文件同步模式 (推荐)
- **前端**: 修改 `frontend/src/` 和 `frontend/public/` 时实时同步到容器
- **后端**: 修改 `backend/agent/` 时实时同步到容器
- **配置文件**: 修改配置文件时自动重建容器
- **优势**: 速度快，无需等待重建

### 重建模式
- **前端**: 修改任何前端文件时自动重建容器
- **后端**: 修改任何后端文件时自动重建容器
- **优势**: 确保环境一致性

### 监控的文件类型
- **前端**: `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.json`, `.md`
- **后端**: `.py`, `.txt`, `.json`, `.yml`, `.yaml`

## 访问地址
- 前端: http://localhost:3000
- 后端 API: http://localhost:8123
- 后端健康检查: http://localhost:8123/health
