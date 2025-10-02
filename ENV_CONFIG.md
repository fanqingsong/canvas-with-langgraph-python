# 环境变量配置说明

本文档说明 Canvas with LangGraph Python 应用所需的环境变量配置。

## 必需环境变量

### JWT 认证配置
```bash
# JWT 密钥（必需，至少32个字符）
JWT_SECRET_KEY=your_jwt_secret_key_change_in_production_minimum_32_characters
```

### OpenAI API 配置
```bash
# OpenAI API 密钥（必需）
OPENAI_API_KEY=your_openai_api_key_here
```

## 可选环境变量

### Azure OpenAI 配置（如果使用 Azure OpenAI）
```bash
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### LangChain 配置
```bash
LANGCHAIN_API_KEY=your_langchain_api_key_here
LANGCHAIN_PROJECT=langgraph-canvas
```

### CopilotKit 配置
```bash
COPILOT_CLOUD_PUBLIC_API_KEY=your_copilot_cloud_public_api_key_here
```

### 应用配置
```bash
PORT=8123
NODE_ENV=development
```

## 配置方法

### 方法1：创建 .env 文件（推荐）

在项目根目录创建 `.env` 文件：

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入实际值
nano .env
```

### 方法2：导出环境变量

```bash
# 设置 JWT 密钥
export JWT_SECRET_KEY="your-secret-key-minimum-32-characters"

# 设置 OpenAI API 密钥
export OPENAI_API_KEY="your-openai-api-key"

# 其他环境变量...
```

### 方法3：在启动脚本中设置

```bash
# 开发环境
JWT_SECRET_KEY="dev-secret-key" ./start-dev.sh

# 生产环境
JWT_SECRET_KEY="prod-secret-key" ./start-prod.sh
```

## 安全建议

### 开发环境
- 可以使用简单的密钥，但建议使用至少32个字符
- 示例：`dev-jwt-secret-key-change-in-production-minimum-32-characters`

### 生产环境
- 必须使用强随机密钥
- 建议使用以下命令生成：
  ```bash
  # 生成32字节的随机密钥
  openssl rand -base64 32
  
  # 或使用 Python
  python3 -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

### 密钥管理
- 不要将密钥提交到版本控制系统
- 使用环境变量或密钥管理服务
- 定期轮换密钥
- 确保 `.env` 文件在 `.gitignore` 中

## 验证配置

运行以下命令验证环境变量是否正确设置：

```bash
# 检查环境变量
echo $JWT_SECRET_KEY
echo $OPENAI_API_KEY

# 运行权限测试
python3 test_permissions.py
```

## 故障排除

### 常见问题

1. **JWT_SECRET_KEY 未设置**
   - 错误：`JWT_SECRET_KEY 环境变量未设置`
   - 解决：设置 JWT_SECRET_KEY 环境变量

2. **OpenAI API 密钥无效**
   - 错误：`OpenAI API 调用失败`
   - 解决：检查 OPENAI_API_KEY 是否正确

3. **权限验证失败**
   - 错误：`无法验证凭据`
   - 解决：检查 JWT_SECRET_KEY 是否一致

### 调试步骤

1. 检查环境变量是否设置：
   ```bash
   env | grep -E "(JWT_SECRET_KEY|OPENAI_API_KEY)"
   ```

2. 检查 Docker 容器环境变量：
   ```bash
   docker compose exec backend env | grep JWT_SECRET_KEY
   ```

3. 查看应用日志：
   ```bash
   docker compose logs backend
   ```

## 示例配置

### 开发环境完整配置
```bash
# .env 文件内容
JWT_SECRET_KEY=dev-jwt-secret-key-change-in-production-minimum-32-characters
OPENAI_API_KEY=sk-your-openai-api-key-here
LANGCHAIN_API_KEY=your-langchain-api-key
LANGCHAIN_PROJECT=langgraph-canvas-dev
NODE_ENV=development
```

### 生产环境完整配置
```bash
# .env 文件内容
JWT_SECRET_KEY=your-very-secure-production-jwt-secret-key-minimum-32-characters
OPENAI_API_KEY=sk-your-production-openai-api-key-here
LANGCHAIN_API_KEY=your-production-langchain-api-key
LANGCHAIN_PROJECT=langgraph-canvas-prod
NODE_ENV=production
```

## 注意事项

1. **环境变量优先级**：命令行 > .env 文件 > 默认值
2. **Docker 环境**：确保环境变量正确传递给容器
3. **重启服务**：修改环境变量后需要重启服务
4. **备份配置**：生产环境配置需要安全备份
