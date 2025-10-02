# 权限校验实现指南

本文档详细说明了如何在 Canvas with LangGraph Python 应用中实现用户权限校验。

## 概述

本应用实现了基于 JWT 的认证系统和基于角色的权限控制（RBAC），确保不同用户只能访问和操作他们有权限的功能。

## 架构设计

### 后端权限系统

1. **认证层** (`auth.py`)
   - JWT token 生成和验证
   - 用户密码加密和验证
   - 用户模型和角色定义

2. **权限层** (`permission_agent.py`)
   - 工具权限映射
   - 权限感知的 LangGraph Agent
   - 动态工具过滤

3. **API 层** (`auth_routes.py`, `main.py`)
   - 认证相关 API 端点
   - 权限检查中间件
   - 用户管理功能

### 前端权限系统

1. **认证上下文** (`contexts/AuthContext.tsx`)
   - 全局认证状态管理
   - 用户信息存储
   - 权限检查函数

2. **UI 组件** (`components/auth/`)
   - 登录/注册表单
   - 用户信息显示
   - 权限状态指示

## 权限模型

### 角色定义

- **admin**: 管理员，拥有所有权限
- **editor**: 编辑者，可以创建和编辑内容
- **viewer**: 查看者，只能查看内容
- **guest**: 访客，基础查看权限

### 权限定义

```python
class Permission(str, Enum):
    # 基础权限
    READ_CANVAS = "read:canvas"
    WRITE_CANVAS = "write:canvas"
    DELETE_CANVAS = "delete:canvas"
    
    # 项目管理权限
    CREATE_PROJECT = "create:project"
    EDIT_PROJECT = "edit:project"
    DELETE_PROJECT = "delete:project"
    
    # 实体管理权限
    CREATE_ENTITY = "create:entity"
    EDIT_ENTITY = "edit:entity"
    DELETE_ENTITY = "delete:entity"
    
    # 笔记管理权限
    CREATE_NOTE = "create:note"
    EDIT_NOTE = "edit:note"
    DELETE_NOTE = "delete:note"
    
    # 图表管理权限
    CREATE_CHART = "create:chart"
    EDIT_CHART = "edit:chart"
    DELETE_CHART = "delete:chart"
    
    # 计划管理权限
    CREATE_PLAN = "create:plan"
    EXECUTE_PLAN = "execute:plan"
    MANAGE_PLAN = "manage:plan"
    
    # 管理员权限
    ADMIN = "admin"
    MANAGE_USERS = "manage:users"
```

## 使用方法

### 1. 启动应用

```bash
# 设置环境变量
export JWT_SECRET_KEY="your-secret-key-minimum-32-characters"

# 启动后端
cd backend/agent
python main.py

# 启动前端
cd frontend
npm run dev
```

### 2. 用户认证

#### 登录
```bash
curl -X POST "http://localhost:8123/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

#### 注册
```bash
curl -X POST "http://localhost:8123/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "password123",
    "role": "editor"
  }'
```

### 3. 权限检查

#### 后端权限检查
```python
from auth import get_current_user, require_permission, Permission

# 在 API 端点中使用
@app.get("/protected-endpoint")
async def protected_endpoint(
    current_user: User = Depends(require_permission(Permission.WRITE_CANVAS))
):
    return {"message": "访问成功", "user": current_user.username}
```

#### 前端权限检查
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/lib/auth';

function MyComponent() {
  const { checkPermission, user } = useAuth();
  
  const canEdit = checkPermission(PERMISSIONS.WRITE_CANVAS);
  const canDelete = checkPermission(PERMISSIONS.DELETE_CANVAS);
  
  return (
    <div>
      {canEdit && <EditButton />}
      {canDelete && <DeleteButton />}
    </div>
  );
}
```

### 4. LangGraph Agent 权限控制

权限系统会自动过滤用户可用的工具：

```python
# 创建权限感知的 Agent
from permission_agent import create_permission_aware_agent

# 为特定用户创建 Agent
user_agent = create_permission_aware_agent(user)

# Agent 只会包含用户有权限的工具
# 例如：查看者用户无法使用 createItem 工具
```

## 测试账户

系统预置了以下测试账户：

| 用户名 | 密码 | 角色 | 权限 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 所有权限 |
| editor | editor123 | 编辑者 | 创建和编辑权限 |
| viewer | viewer123 | 查看者 | 只读权限 |
| guest | guest123 | 访客 | 基础查看权限 |

## 安全考虑

### 1. JWT 安全
- 使用强密钥（至少32字符）
- 设置合理的过期时间
- 在生产环境中使用 HTTPS

### 2. 密码安全
- 使用 bcrypt 加密
- 强制密码复杂度要求
- 定期更新密码

### 3. 权限验证
- 所有敏感操作都需要权限验证
- 前端权限检查仅用于 UI 显示
- 后端权限检查是最终的安全保障

## 扩展权限系统

### 添加新权限

1. 在 `auth.py` 中添加新权限：
```python
class Permission(str, Enum):
    # 现有权限...
    NEW_PERMISSION = "new:permission"
```

2. 更新角色权限映射：
```python
ROLE_PERMISSIONS = {
    Role.ADMIN: [
        # 现有权限...
        Permission.NEW_PERMISSION,
    ],
    # 其他角色...
}
```

3. 在工具权限映射中添加：
```python
permission_tool_mapping = {
    # 现有映射...
    "new_tool": Permission.NEW_PERMISSION,
}
```

### 添加新角色

1. 在 `auth.py` 中定义新角色：
```python
class Role(str, Enum):
    # 现有角色...
    CUSTOM_ROLE = "custom_role"
```

2. 定义角色权限：
```python
ROLE_PERMISSIONS = {
    # 现有角色...
    Role.CUSTOM_ROLE: [
        Permission.READ_CANVAS,
        Permission.CREATE_PROJECT,
        # 其他权限...
    ],
}
```

## 故障排除

### 常见问题

1. **JWT 验证失败**
   - 检查 JWT_SECRET_KEY 环境变量
   - 确认 token 未过期
   - 验证 token 格式

2. **权限检查失败**
   - 确认用户角色正确
   - 检查权限映射配置
   - 验证工具名称匹配

3. **前端认证问题**
   - 检查 localStorage 中的 token
   - 确认 API 端点可访问
   - 验证 CORS 配置

### 调试工具

运行权限系统演示：
```bash
cd backend/agent
python permission_example.py
```

这将显示不同角色的权限详情和工具访问情况。

## 总结

本权限系统提供了完整的用户认证和权限控制功能，支持：

- JWT 认证
- 基于角色的权限控制
- 动态工具过滤
- 前后端权限同步
- 易于扩展的架构

通过合理使用这些功能，可以确保应用的安全性和用户体验。
