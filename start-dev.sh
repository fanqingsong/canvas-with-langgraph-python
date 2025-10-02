#!/bin/bash

# 开发环境启动脚本
# 同时启动服务和watch功能

echo "🚀 启动开发环境..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 停止现有服务
echo "🛑 停止现有服务..."
docker compose -f docker-compose.dev.yml down

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker compose -f docker-compose.dev.yml up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker compose -f docker-compose.dev.yml ps

# 启动watch功能
echo "👀 启动文件监控..."
echo "💡 提示：按 Ctrl+C 停止监控"
docker compose -f docker-compose.dev.yml watch