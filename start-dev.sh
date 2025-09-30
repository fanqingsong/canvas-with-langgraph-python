#!/bin/bash

echo "🚀 启动开发环境 - Canvas with LangGraph Python"
echo "📁 项目结构："
echo "   ├── frontend/     # Next.js + CopilotKit 前端"
echo "   ├── backend/      # Python + LangGraph 后端"
echo "   └── docker-compose.dev.yml"
echo ""
echo "🔥 开发模式特性："
echo "   - 文件同步: 修改代码时实时同步到容器"
echo "   - 热加载: 无需重建容器，开发效率更高"
echo "   - 实时调试: 支持断点和日志查看"
echo ""

# 停止现有容器并清理
echo "📦 停止现有容器并清理..."
docker compose -f docker-compose.dev.yml down --remove-orphans

# 使用开发配置启动 watch 模式
echo "🔨 启动开发模式 (文件同步 + 热加载)..."
echo "💡 提示: 修改代码后会自动同步到容器，无需重建"
echo ""

# 启动 watch 模式
docker compose -f docker-compose.dev.yml watch

echo ""
echo "✅ 开发模式已停止"
echo "📊 查看日志: docker compose -f docker-compose.dev.yml logs -f"
