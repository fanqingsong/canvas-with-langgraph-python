#!/bin/bash

echo "🧪 测试认证功能..."

# 1. 测试登录
echo "📝 步骤1: 测试登录"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8123/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123")

echo "登录响应: $LOGIN_RESPONSE"

# 提取token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "提取的token: $TOKEN"

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ 登录失败，无法获取token"
    exit 1
fi

echo "✅ 登录成功，token: ${TOKEN:0:20}..."

# 2. 测试用户信息
echo "📝 步骤2: 测试用户信息"
USER_RESPONSE=$(curl -s -X GET http://localhost:8123/auth/me \
  -H "Authorization: Bearer $TOKEN")

echo "用户信息响应: $USER_RESPONSE"

# 3. 测试权限检查
echo "📝 步骤3: 测试权限检查"
PERM_RESPONSE=$(curl -s -X GET http://localhost:8123/permissions/check \
  -H "Authorization: Bearer $TOKEN")

echo "权限检查响应: $PERM_RESPONSE"

# 4. 测试前端CopilotKit API
echo "📝 步骤4: 测试前端CopilotKit API"
COPILOTKIT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/copilotkit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "messages": [{"id": "test-msg-1", "role": "user", "content": "Hello, test message"}],
    "threadId": "test-thread-123"
  }')

echo "CopilotKit响应: $COPILOTKIT_RESPONSE"

echo "🎉 测试完成！"
