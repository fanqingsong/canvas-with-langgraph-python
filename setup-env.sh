#!/bin/bash

# Canvas with LangGraph Python - 环境变量设置脚本

echo "🔧 Canvas with LangGraph Python - 环境变量设置"
echo "=============================================="
echo ""

# 检查是否已存在 .env 文件
if [ -f ".env" ]; then
    echo "⚠️  发现现有的 .env 文件"
    read -p "是否要覆盖现有配置？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 取消设置，保留现有配置"
        exit 0
    fi
fi

echo "📝 创建 .env 文件..."

# 创建 .env 文件
cat > .env << 'EOF'
# Canvas with LangGraph Python - 环境变量配置
# 请根据实际情况修改以下配置

# OpenAI API 配置 (必需)
OPENAI_API_KEY=your_openai_api_key_here

# JWT 认证配置 (必需，至少32个字符)
JWT_SECRET_KEY=your_jwt_secret_key_change_in_production_minimum_32_characters

# LangChain 配置 (可选)
LANGCHAIN_API_KEY=your_langchain_api_key_here
LANGCHAIN_PROJECT=langgraph-canvas

# CopilotKit 配置 (可选)
COPILOT_CLOUD_PUBLIC_API_KEY=your_copilot_cloud_public_api_key_here

# Azure OpenAI 配置 (可选，如果使用 Azure OpenAI)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# 应用配置
PORT=8123
NODE_ENV=development
EOF

echo "✅ .env 文件已创建"
echo ""

# 提示用户编辑配置
echo "📋 下一步操作："
echo "1. 编辑 .env 文件，填入您的实际配置："
echo "   nano .env"
echo ""
echo "2. 至少需要设置以下变量："
echo "   - OPENAI_API_KEY: 您的 OpenAI API 密钥"
echo "   - JWT_SECRET_KEY: JWT 认证密钥（至少32个字符）"
echo ""

# 提供生成 JWT 密钥的建议
echo "💡 生成安全的 JWT 密钥："
echo "   # 使用 OpenSSL"
echo "   openssl rand -base64 32"
echo ""
echo "   # 或使用 Python"
echo "   python3 -c \"import secrets; print(secrets.token_urlsafe(32))\""
echo ""

# 检查是否设置了环境变量
if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your_openai_api_key_here" ]; then
    echo "🔍 检测到 OPENAI_API_KEY 环境变量，是否要自动设置？"
    read -p "(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i "s/OPENAI_API_KEY=your_openai_api_key_here/OPENAI_API_KEY=$OPENAI_API_KEY/" .env
        echo "✅ 已自动设置 OPENAI_API_KEY"
    fi
fi

if [ -n "$JWT_SECRET_KEY" ] && [ "$JWT_SECRET_KEY" != "your_jwt_secret_key_change_in_production_minimum_32_characters" ]; then
    echo "🔍 检测到 JWT_SECRET_KEY 环境变量，是否要自动设置？"
    read -p "(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i "s/JWT_SECRET_KEY=your_jwt_secret_key_change_in_production_minimum_32_characters/JWT_SECRET_KEY=$JWT_SECRET_KEY/" .env
        echo "✅ 已自动设置 JWT_SECRET_KEY"
    fi
fi

echo ""
echo "🚀 配置完成后，可以启动应用："
echo "   开发环境: ./start-dev.sh"
echo "   生产环境: ./start-prod.sh"
echo ""
echo "📚 更多信息请查看："
echo "   - 环境配置指南: cat ENV_CONFIG.md"
echo "   - 权限系统指南: cat PERMISSION_GUIDE.md"
echo "   - 项目说明: cat README.md"
