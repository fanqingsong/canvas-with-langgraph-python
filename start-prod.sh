#!/bin/bash

echo "🚀 启动生产环境 - Canvas with LangGraph Python (带权限校验)"
echo "📁 项目结构："
echo "   ├── frontend/     # Next.js + CopilotKit 前端"
echo "   ├── backend/      # Python + LangGraph 后端"
echo "   └── docker-compose.yml"
echo ""
echo "💡 这是生产环境启动脚本，使用优化的 Docker 镜像"
echo "🔐 包含完整的权限校验系统"
echo ""

# 检查环境变量
if [ -z "$JWT_SECRET_KEY" ]; then
    echo "❌ 错误: JWT_SECRET_KEY 环境变量未设置"
    echo "   生产环境必须设置安全的 JWT 密钥"
    echo "   设置示例: export JWT_SECRET_KEY='your-secure-secret-key-minimum-32-characters'"
    echo "   建议使用强随机密钥，例如: openssl rand -base64 32"
    exit 1
fi

echo "✅ JWT_SECRET_KEY 已设置"

# 停止现有容器并清理
echo "📦 停止现有容器并清理..."
docker compose down --remove-orphans --volumes

# 强制删除可能存在的同名容器
echo "🧹 清理可能存在的同名容器..."
docker rm -f canvas-with-langgraph-python-backend-1 2>/dev/null || true
docker rm -f canvas-with-langgraph-python-frontend-1 2>/dev/null || true

# 清理未使用的网络
echo "🌐 清理未使用的网络..."
docker network prune -f

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 20

# 检查服务状态
echo "🔍 检查服务状态..."
docker compose ps

# 检查后端健康状态
echo "🏥 检查后端健康状态..."
for i in {1..10}; do
    if curl -f http://localhost:8123/health 2>/dev/null; then
        echo "✅ 后端服务已就绪"
        break
    else
        echo "⏳ 等待后端服务启动... ($i/10)"
        sleep 3
    fi
done

# 检查前端服务
echo "🌐 检查前端服务..."
for i in {1..10}; do
    if curl -f http://localhost:3000 2>/dev/null; then
        echo "✅ 前端服务已就绪"
        break
    else
        echo "⏳ 等待前端服务启动... ($i/10)"
        sleep 3
    fi
done

echo ""
echo "✅ 服务启动完成！"
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:8123"
echo "📊 查看日志: docker compose logs -f"
echo "🔍 查看后端日志: docker compose logs -f backend"
echo "🔍 查看前端日志: docker compose logs -f frontend"
echo ""
echo "🔐 权限系统测试账户："
echo "   管理员: admin / admin123"
echo "   编辑者: editor / editor123"
echo "   查看者: viewer / viewer123"
echo "   访客: guest / guest123"
echo ""
echo "📖 项目结构说明: cat PROJECT_STRUCTURE.md"
echo "📚 权限系统指南: cat PERMISSION_GUIDE.md"
echo "🧪 运行权限测试: python3 test_permissions.py"
