#!/bin/bash

echo "🧪 测试热加载功能..."
echo ""

# 检查服务是否运行
echo "🔍 检查服务状态..."
if ! docker compose ps | grep -q "Up"; then
    echo "❌ 服务未运行，请先启动服务："
    echo "   ./dev-sync.sh  # 开发模式"
    echo "   ./start.sh     # 生产模式"
    exit 1
fi

echo "✅ 服务正在运行"
echo ""

# 测试前端热加载
echo "🔥 测试前端热加载..."
echo "修改 frontend/src/app/page.tsx 文件..."

# 备份原文件
cp frontend/src/app/page.tsx frontend/src/app/page.tsx.backup

# 添加测试注释
echo "// 热加载测试 - $(date)" >> frontend/src/app/page.tsx

echo "✅ 前端文件已修改，请检查浏览器是否自动更新"
echo ""

# 测试后端热加载
echo "🔥 测试后端热加载..."
echo "修改 backend/agent/main.py 文件..."

# 备份原文件
cp backend/agent/main.py backend/agent/main.py.backup

# 添加测试注释
echo "# 热加载测试 - $(date)" >> backend/agent/main.py

echo "✅ 后端文件已修改，请检查后端日志是否重新加载"
echo ""

# 等待用户确认
echo "⏳ 等待 10 秒后恢复原文件..."
sleep 10

# 恢复原文件
echo "🔄 恢复原文件..."
mv frontend/src/app/page.tsx.backup frontend/src/app/page.tsx
mv backend/agent/main.py.backup backend/agent/main.py

echo "✅ 测试完成！"
echo ""
echo "💡 如果看到服务自动重新加载，说明热加载功能正常工作"
echo "📊 查看日志: docker compose logs -f"
