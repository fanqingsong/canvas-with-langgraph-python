# Canvas with LangGraph Python - Docker 部署指南

本项目使用 Docker Compose 技术进行容器化部署，提供一键运行脚本，支持跨平台运行。

## 🚀 快速开始

### 1. 环境要求

- Docker (版本 20.10+)
- Docker Compose (版本 2.0+)
- Git

### 2. 克隆项目

```bash
git clone <repository-url>
cd canvas-with-langgraph-python
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量文件
nano .env  # 或使用其他编辑器
```

**必需的环境变量：**
- `OPENAI_API_KEY`: OpenAI API 密钥
- `LANGCHAIN_API_KEY`: LangChain API 密钥（可选）

### 4. 一键运行

#### Linux/macOS
```bash
# 启动服务
./run.sh start

# 查看日志
./run.sh logs

# 停止服务
./run.sh stop
```

#### Windows
```cmd
# 启动服务
run.bat start

# 查看日志
run.bat logs

# 停止服务
run.bat stop
```

## 📋 可用命令

| 命令 | 描述 |
|------|------|
| `start` | 启动所有服务（默认） |
| `stop` | 停止所有服务 |
| `restart` | 重启所有服务 |
| `build` | 构建 Docker 镜像 |
| `logs` | 查看服务日志 |
| `clean` | 清理容器和镜像 |
| `status` | 查看服务状态 |
| `help` | 显示帮助信息 |

## 🏗️ 项目架构

```
├── frontend/          # Next.js 前端应用
│   ├── Dockerfile.frontend
│   └── ...
├── agent/             # Python LangGraph 后端
│   ├── Dockerfile.backend
│   ├── agent.py
│   ├── requirements.txt
│   └── langgraph.json
├── docker-compose.yml # Docker Compose 配置
├── run.sh            # Linux/macOS 运行脚本
├── run.bat           # Windows 运行脚本
├── .env.example      # 环境变量模板
└── .dockerignore     # Docker 忽略文件
```

## 🔧 服务配置

### 前端服务 (Next.js)
- **端口**: 3000
- **访问地址**: http://localhost:3000
- **环境变量**: 
  - `NEXT_PUBLIC_AGENT_URL`: 后端服务地址

### 后端服务 (Python LangGraph)
- **端口**: 8123
- **访问地址**: http://localhost:8123
- **环境变量**:
  - `OPENAI_API_KEY`: OpenAI API 密钥
  - `LANGCHAIN_API_KEY`: LangChain API 密钥
  - `LANGCHAIN_PROJECT`: 项目名称

## 🐳 Docker 镜像说明

### 前端镜像 (Dockerfile.frontend)
- 基于 Node.js 20 Alpine
- 使用华为云镜像加速
- 多阶段构建优化镜像大小
- 支持 Next.js 生产环境

### 后端镜像 (Dockerfile.backend)
- 基于 Python 3.12 Slim
- 使用华为云镜像加速
- 安装 LangGraph 相关依赖
- 支持热重载开发模式

## 🔍 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :8123
   
   # 停止占用端口的进程
   sudo kill -9 <PID>
   ```

2. **Docker 权限问题**
   ```bash
   # 将用户添加到 docker 组
   sudo usermod -aG docker $USER
   # 重新登录或执行
   newgrp docker
   ```

3. **环境变量未生效**
   ```bash
   # 检查 .env 文件是否存在
   ls -la .env
   
   # 检查环境变量内容
   cat .env
   ```

4. **服务启动失败**
   ```bash
   # 查看详细日志
   ./run.sh logs
   
   # 检查服务状态
   ./run.sh status
   ```

### 日志查看

```bash
# 查看所有服务日志
./run.sh logs

# 查看特定服务日志
docker compose logs frontend
docker compose logs backend

# 实时查看日志
docker compose logs -f
```

## 🧹 清理和维护

### 清理 Docker 环境
```bash
# 清理所有容器和镜像
./run.sh clean

# 手动清理
docker compose down -v --remove-orphans
docker system prune -f
```

### 更新服务
```bash
# 重新构建镜像
./run.sh build

# 重启服务
./run.sh restart
```

## 🔒 安全注意事项

1. **API 密钥安全**
   - 不要将 `.env` 文件提交到版本控制
   - 使用强密码和安全的 API 密钥
   - 定期轮换 API 密钥

2. **网络安全**
   - 生产环境建议使用 HTTPS
   - 配置防火墙规则
   - 限制容器网络访问

3. **数据持久化**
   - 重要数据使用 Docker volumes
   - 定期备份数据
   - 监控磁盘空间使用

## 📚 开发指南

### 本地开发
```bash
# 安装依赖
npm install
cd agent && pip install -r requirements.txt

# 启动开发服务
npm run dev
```

### 生产部署
```bash
# 构建生产镜像
./run.sh build

# 启动生产服务
./run.sh start
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 获取帮助

如果遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查项目的 Issues 页面
3. 创建新的 Issue 描述问题

---

**享受使用 Canvas with LangGraph Python！** 🎉
