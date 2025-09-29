#!/bin/bash

# 优化构建脚本 - 使用 Docker 构建缓存加速构建

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    echo -e "${2}${1}${NC}"
}

print_message "🚀 开始优化构建..." $BLUE

# 设置 Docker 构建参数
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# 设置国内镜像源环境变量
export NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
export PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
export PIP_EXTRA_INDEX_URL=https://pypi.org/simple

print_message "📦 配置镜像源..." $YELLOW
print_message "NPM 镜像源: https://registry.npmmirror.com" $GREEN
print_message "PIP 镜像源: https://pypi.tuna.tsinghua.edu.cn/simple" $GREEN

# 清理旧的容器和网络
print_message "🧹 清理旧容器..." $YELLOW
docker compose down 2>/dev/null || true

# 构建镜像（使用缓存）
print_message "🔨 开始构建 Docker 镜像（使用缓存）..." $YELLOW
docker compose build --parallel

# 启动服务
print_message "🚀 启动服务..." $YELLOW
docker compose up -d

# 等待服务启动
print_message "⏳ 等待服务启动..." $YELLOW
sleep 10

# 检查服务状态
print_message "📊 检查服务状态..." $YELLOW
docker compose ps

# 检查服务健康状态
print_message "🏥 检查服务健康状态..." $YELLOW

# 检查前端服务
if curl -s http://localhost:3000 > /dev/null; then
    print_message "✅ 前端服务运行正常 (http://localhost:3000)" $GREEN
else
    print_message "❌ 前端服务启动失败" $RED
fi

# 检查后端服务
if curl -s http://localhost:8123/health > /dev/null; then
    print_message "✅ 后端服务运行正常 (http://localhost:8123)" $GREEN
else
    print_message "⚠️  后端服务可能还在启动中..." $YELLOW
    print_message "   查看后端日志: docker compose logs backend" $YELLOW
fi

print_message "🎉 构建完成！" $GREEN
print_message "前端: http://localhost:3000" $BLUE
print_message "后端: http://localhost:8123" $BLUE
print_message "查看日志: docker compose logs -f" $BLUE

