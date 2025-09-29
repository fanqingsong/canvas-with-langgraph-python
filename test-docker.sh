#!/bin/bash

# Docker 环境测试脚本
# 用于验证 Docker 和 Docker Compose 是否正确安装和配置

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

print_message "开始 Docker 环境测试..." $BLUE

# 测试 Docker 是否安装
print_message "1. 检查 Docker 安装..." $YELLOW
if command -v docker &> /dev/null; then
    docker_version=$(docker --version)
    print_message "✅ Docker 已安装: $docker_version" $GREEN
else
    print_message "❌ Docker 未安装" $RED
    exit 1
fi

# 测试 Docker Compose 是否安装
print_message "2. 检查 Docker Compose 安装..." $YELLOW
if command -v docker compose &> /dev/null; then
    compose_version=$(docker compose version)
    print_message "✅ Docker Compose 已安装: $compose_version" $GREEN
else
    print_message "❌ Docker Compose 未安装" $RED
    exit 1
fi

# 测试 Docker 守护进程是否运行
print_message "3. 检查 Docker 守护进程..." $YELLOW
if docker info &> /dev/null; then
    print_message "✅ Docker 守护进程正在运行" $GREEN
else
    print_message "❌ Docker 守护进程未运行，请启动 Docker" $RED
    exit 1
fi

# 测试 Docker 网络
print_message "4. 检查 Docker 网络..." $YELLOW
if docker network ls &> /dev/null; then
    print_message "✅ Docker 网络功能正常" $GREEN
else
    print_message "❌ Docker 网络功能异常" $RED
    exit 1
fi

# 测试端口是否可用
print_message "5. 检查端口可用性..." $YELLOW
check_port() {
    local port=$1
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        print_message "⚠️  端口 $port 已被占用" $YELLOW
        return 1
    else
        print_message "✅ 端口 $port 可用" $GREEN
        return 0
    fi
}

check_port 3000
check_port 8123

# 测试环境变量文件
print_message "6. 检查环境变量文件..." $YELLOW
if [ -f ".env" ]; then
    print_message "✅ .env 文件存在" $GREEN
else
    if [ -f ".env.example" ]; then
        print_message "⚠️  .env 文件不存在，但 .env.example 存在" $YELLOW
        print_message "请复制 .env.example 到 .env 并配置相关参数" $YELLOW
    else
        print_message "❌ 环境变量文件不存在" $RED
    fi
fi

# 测试 Docker Compose 配置
print_message "7. 验证 Docker Compose 配置..." $YELLOW
if docker compose config &> /dev/null; then
    print_message "✅ Docker Compose 配置有效" $GREEN
else
    print_message "❌ Docker Compose 配置无效" $RED
    docker compose config
    exit 1
fi

print_message "🎉 Docker 环境测试完成！" $GREEN
print_message "现在可以运行 './run.sh start' 启动服务" $BLUE
