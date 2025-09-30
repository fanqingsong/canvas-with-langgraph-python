#!/bin/bash

# 构建前端 Docker 镜像的脚本
# 包含网络优化和错误处理

echo "开始构建前端 Docker 镜像..."

# 设置构建参数
DOCKER_BUILDKIT=1
BUILD_ARGS=""

# 检查是否有代理设置
if [ ! -z "$HTTP_PROXY" ]; then
    BUILD_ARGS="$BUILD_ARGS --build-arg HTTP_PROXY=$HTTP_PROXY"
fi

if [ ! -z "$HTTPS_PROXY" ]; then
    BUILD_ARGS="$BUILD_ARGS --build-arg HTTPS_PROXY=$HTTPS_PROXY"
fi

if [ ! -z "$NO_PROXY" ]; then
    BUILD_ARGS="$BUILD_ARGS --build-arg NO_PROXY=$NO_PROXY"
fi

# 构建镜像
echo "使用构建参数: $BUILD_ARGS"
echo "使用 Dockerfile: Dockerfile.frontend"
docker build $BUILD_ARGS -f Dockerfile.frontend -t canvas-frontend:latest .

if [ $? -eq 0 ]; then
    echo "✅ 前端镜像构建成功!"
else
    echo "❌ 前端镜像构建失败!"
    echo "💡 如果仍然遇到网络问题，请尝试："
    echo "   1. 检查网络连接"
    echo "   2. 设置代理环境变量: export HTTP_PROXY=your_proxy"
    echo "   3. 使用国内镜像源"
    exit 1
fi
