#!/bin/bash

# 使用国内镜像加速构建脚本

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

print_message "🚀 开始使用国内镜像加速构建..." $BLUE

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

# 构建镜像
print_message "🔨 开始构建 Docker 镜像..." $YELLOW
docker compose build --no-cache --parallel

# 启动服务
print_message "🚀 启动服务..." $YELLOW
docker compose up -d

# 等待服务启动
print_message "⏳ 等待服务启动..." $YELLOW
sleep 15

# 检查服务状态
print_message "🔍 检查服务状态..." $YELLOW
docker compose ps

# 显示访问地址
print_message "✅ 构建完成！" $GREEN
print_message "前端地址: http://localhost:3000" $GREEN
print_message "后端地址: http://localhost:8123" $GREEN
print_message "使用 'docker compose logs -f' 查看日志" $BLUE
