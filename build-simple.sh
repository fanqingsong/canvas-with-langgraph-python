#!/bin/bash

echo "🚀 开始简化构建和启动容器..."

# 停止现有容器
echo "📦 停止现有容器..."
docker compose down

# 只重新构建，不清理缓存
echo "🔨 重新构建镜像（使用缓存）..."
docker compose build

# 启动服务
echo "▶️ 启动服务..."
docker compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "🔍 检查服务状态..."
docker compose ps

# 检查后端健康状态
echo "🏥 检查后端健康状态..."
for i in {1..5}; do
    if curl -f http://localhost:8123/health; then
        echo "✅ 后端服务已就绪"
        break
    else
        echo "⏳ 等待后端服务启动... ($i/5)"
        sleep 5
    fi
done

# 检查前端服务
echo "🌐 检查前端服务..."
for i in {1..5}; do
    if curl -f http://localhost:3000; then
        echo "✅ 前端服务已就绪"
        break
    else
        echo "⏳ 等待前端服务启动... ($i/5)"
        sleep 5
    fi
done

echo "✅ 容器构建和启动完成！"
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:8123"
echo "📊 查看日志: docker compose logs -f"
