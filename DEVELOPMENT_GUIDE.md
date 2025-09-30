# 开发指南

## 🚀 快速开始

### 1. 生产环境启动
```bash
# 一键启动生产环境
./start.sh

# 或手动启动
docker compose up -d
```

### 2. 开发环境启动 (推荐)
```bash
# 文件同步模式 - 最快，修改代码时实时同步到容器
./dev-sync.sh

# 重建模式 - 修改代码时重建容器
./dev.sh
```

## 📁 项目结构

```
canvas-with-langgraph-python/
├── frontend/                    # 前端服务
│   ├── src/                    # 源代码
│   ├── public/                 # 静态资源
│   ├── package.json            # 依赖配置
│   └── Dockerfile.frontend     # 前端 Docker 配置
├── backend/                    # 后端服务
│   ├── agent/                  # LangGraph Agent
│   └── Dockerfile.backend      # 后端 Docker 配置
├── docker-compose.yml          # 生产环境配置
├── docker-compose.dev.yml      # 开发环境配置
└── 各种启动脚本...
```

## 🔥 热加载功能

### 文件同步模式 (推荐)
- **速度**: 最快，文件修改后立即同步
- **适用**: 日常开发
- **启动**: `./dev-sync.sh`

### 重建模式
- **速度**: 较慢，需要重建容器
- **适用**: 需要完整环境重建时
- **启动**: `./dev.sh`

## 🛠️ 开发工作流

### 1. 启动开发环境
```bash
./dev-sync.sh
```

### 2. 修改代码
- 前端代码: 修改 `frontend/src/` 下的文件
- 后端代码: 修改 `backend/agent/` 下的文件
- 配置文件: 修改后会自动重建容器

### 3. 查看日志
```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f frontend
docker compose logs -f backend
```

### 4. 测试热加载
```bash
./test-hot-reload.sh
```

## 🔧 常用命令

### Docker Compose 命令
```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 重建服务
docker compose build

# 使用开发配置
docker compose -f docker-compose.dev.yml up -d
```

### 开发模式命令
```bash
# 启动开发模式 (文件同步)
docker compose -f docker-compose.dev.yml watch

# 启动开发模式 (重建)
docker compose watch
```

## 🌐 访问地址

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8123
- **健康检查**: http://localhost:8123/health

## 🐛 故障排除

### 1. 服务无法启动
```bash
# 查看详细日志
docker compose logs

# 重建所有服务
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 2. 热加载不工作
```bash
# 检查文件权限
ls -la frontend/src/
ls -la backend/agent/

# 重启开发模式
docker compose -f docker-compose.dev.yml down
./dev-sync.sh
```

### 3. 端口冲突
```bash
# 检查端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :8123

# 修改端口 (在 docker-compose.yml 中)
ports:
  - "3001:3000"  # 前端
  - "8124:8123"  # 后端
```

## 📝 开发建议

1. **使用文件同步模式**: 日常开发时使用 `./dev-sync.sh`
2. **定期重建**: 遇到奇怪问题时重建容器
3. **查看日志**: 遇到问题时先查看日志
4. **测试热加载**: 使用 `./test-hot-reload.sh` 验证功能
5. **备份重要文件**: 修改前先备份重要配置文件
