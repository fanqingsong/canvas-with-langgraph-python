# 🚀 启动脚本说明

本项目提供了多个启动脚本，每个脚本都有特定的用途：

## 📋 脚本列表

### 1. `start-prod.sh` - 生产环境启动
```bash
./start-prod.sh
```
- **用途**: 启动生产环境
- **特点**: 使用优化的 Docker 镜像，适合部署
- **配置**: 使用 `docker-compose.yml`

### 2. `start-dev.sh` - 开发环境启动
```bash
./start-dev.sh
```
- **用途**: 启动开发环境（推荐用于开发）
- **特点**: 文件同步 + 热加载，修改代码实时生效
- **配置**: 使用 `docker-compose.dev.yml`

### 3. `manage.sh` - 服务管理脚本
```bash
./manage.sh [选项]
```
- **用途**: 全面的服务管理工具
- **选项**:
  - `start` - 启动所有服务（默认）
  - `quick` - 快速启动（使用缓存）
  - `stop` - 停止所有服务
  - `restart` - 重启所有服务
  - `build` - 构建镜像
  - `logs` - 查看日志
  - `clean` - 清理容器和镜像
  - `status` - 查看服务状态
  - `help` - 显示帮助信息

## 🎯 使用建议

### 开发阶段
```bash
# 推荐使用开发环境启动
./start-dev.sh
```

### 生产部署
```bash
# 使用生产环境启动
./start-prod.sh
```

### 日常管理
```bash
# 查看服务状态
./manage.sh status

# 查看日志
./manage.sh logs

# 清理环境
./manage.sh clean
```

## 🔧 服务地址

- **前端**: http://localhost:3000
- **后端**: http://localhost:8123
- **健康检查**: http://localhost:8123/health

## 📝 注意事项

1. 首次运行需要构建镜像，可能需要几分钟
2. 开发环境支持热加载，修改代码后无需重启
3. 生产环境使用优化镜像，启动更快但不支持热加载
4. 使用 `Ctrl+C` 停止服务
