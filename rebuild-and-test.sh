#!/bin/bash

echo "🚀 开始重新构建和启动容器..."

# 停止现有容器
echo "📦 停止现有容器..."
docker compose down

# 清理旧的镜像（可选）
echo "🧹 清理旧的镜像..."
docker compose down --rmi all --volumes --remove-orphans

# 重新构建镜像
echo "🔨 重新构建镜像..."
docker compose build --no-cache

# 启动服务
echo "▶️ 启动服务..."
docker compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker compose ps

# 检查后端健康状态
echo "🏥 检查后端健康状态..."
curl -f http://localhost:8123/health || echo "❌ 后端服务未就绪"

# 检查前端服务
echo "🌐 检查前端服务..."
curl -f http://localhost:3000 || echo "❌ 前端服务未就绪"

echo "✅ 容器重新构建和启动完成！"
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:8123"
echo "📊 查看日志: docker compose logs -f"
