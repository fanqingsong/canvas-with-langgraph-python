"""
认证和权限管理模块
提供用户认证、JWT token 管理和权限检查功能
"""

import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from enum import Enum
from dataclasses import dataclass

from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# 简化的密码哈希实现，避免 bcrypt 兼容性问题
def simple_hash_password(password: str) -> str:
    """简单的密码哈希实现"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}:{password_hash.hex()}"

def simple_verify_password(plain_password: str, hashed_password: str) -> bool:
    """简单的密码验证实现"""
    try:
        salt, stored_hash = hashed_password.split(':')
        password_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return password_hash.hex() == stored_hash
    except (ValueError, AttributeError):
        return False

# JWT 配置
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# HTTP Bearer 认证
security = HTTPBearer()

class Permission(str, Enum):
    """权限枚举"""
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

class Role(str, Enum):
    """角色枚举"""
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"
    GUEST = "guest"

@dataclass
class User:
    """用户模型"""
    id: str
    username: str
    email: str
    hashed_password: str
    role: Role
    permissions: List[Permission]
    is_active: bool = True
    created_at: datetime = None
    last_login: Optional[datetime] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()

# 角色权限映射
ROLE_PERMISSIONS = {
    Role.ADMIN: [
        Permission.READ_CANVAS,
        Permission.WRITE_CANVAS,
        Permission.DELETE_CANVAS,
        Permission.CREATE_PROJECT,
        Permission.EDIT_PROJECT,
        Permission.DELETE_PROJECT,
        Permission.CREATE_ENTITY,
        Permission.EDIT_ENTITY,
        Permission.DELETE_ENTITY,
        Permission.CREATE_NOTE,
        Permission.EDIT_NOTE,
        Permission.DELETE_NOTE,
        Permission.CREATE_CHART,
        Permission.EDIT_CHART,
        Permission.DELETE_CHART,
        Permission.CREATE_PLAN,
        Permission.EXECUTE_PLAN,
        Permission.MANAGE_PLAN,
        Permission.ADMIN,
        Permission.MANAGE_USERS,
    ],
    Role.EDITOR: [
        Permission.READ_CANVAS,
        Permission.WRITE_CANVAS,
        Permission.CREATE_PROJECT,
        Permission.EDIT_PROJECT,
        Permission.CREATE_ENTITY,
        Permission.EDIT_ENTITY,
        Permission.CREATE_NOTE,
        Permission.EDIT_NOTE,
        Permission.CREATE_CHART,
        Permission.EDIT_CHART,
        Permission.CREATE_PLAN,
        Permission.EXECUTE_PLAN,
    ],
    Role.VIEWER: [
        Permission.READ_CANVAS,
    ],
    Role.GUEST: [
        Permission.READ_CANVAS,
    ],
}

# 内存中的用户存储（生产环境应使用数据库）
USERS_DB: Dict[str, User] = {}

def get_password_hash(password: str) -> str:
    """生成密码哈希"""
    return simple_hash_password(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return simple_verify_password(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """创建访问令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """验证 JWT 令牌"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return payload
    except JWTError:
        return None

def get_user(username: str) -> Optional[User]:
    """根据用户名获取用户"""
    return USERS_DB.get(username)

def authenticate_user(username: str, password: str) -> Optional[User]:
    """验证用户凭据"""
    user = get_user(username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_user(username: str, email: str, password: str, role: Role = Role.VIEWER) -> User:
    """创建新用户"""
    if username in USERS_DB:
        raise ValueError("用户已存在")
    
    hashed_password = get_password_hash(password)
    permissions = ROLE_PERMISSIONS.get(role, [])
    
    user = User(
        id=username,  # 简化处理，使用用户名作为ID
        username=username,
        email=email,
        hashed_password=hashed_password,
        role=role,
        permissions=permissions
    )
    
    USERS_DB[username] = user
    return user

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """获取当前认证用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    user = get_user(username)
    if user is None:
        raise credentials_exception
    
    return user

def require_permission(permission: Permission):
    """权限装饰器工厂"""
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if permission not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足：需要 {permission} 权限"
            )
        return current_user
    return permission_checker

def require_role(role: Role):
    """角色装饰器工厂"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != role and current_user.role != Role.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足：需要 {role} 角色"
            )
        return current_user
    return role_checker

def has_permission(user: User, permission: Permission) -> bool:
    """检查用户是否有特定权限"""
    return permission in user.permissions

def has_role(user: User, role: Role) -> bool:
    """检查用户是否有特定角色"""
    return user.role == role or user.role == Role.ADMIN

# 初始化默认用户
def init_default_users():
    """初始化默认用户"""
    if not USERS_DB:
        # 创建管理员用户
        create_user("admin", "admin@example.com", "admin123", Role.ADMIN)
        # 创建编辑者用户
        create_user("editor", "editor@example.com", "editor123", Role.EDITOR)
        # 创建查看者用户
        create_user("viewer", "viewer@example.com", "viewer123", Role.VIEWER)
        # 创建访客用户
        create_user("guest", "guest@example.com", "guest123", Role.GUEST)

# 在模块加载时初始化默认用户
init_default_users()
