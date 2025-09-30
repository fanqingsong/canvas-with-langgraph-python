#!/bin/bash

echo "🚀 开始快速构建和启动容器..."

# 停止现有容器
echo "📦 停止现有容器..."
docker compose down

# 构建所有服务
echo "🔨 构建所有服务镜像..."
docker compose build

# 启动服务
echo "▶️ 启动服务..."
docker compose up -d

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
echo "✅ 容器构建和启动完成！"
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:8123"
echo "📊 查看日志: docker compose logs -f"
echo "🔍 查看后端日志: docker compose logs -f backend"
echo "🔍 查看前端日志: docker compose logs -f frontend"
