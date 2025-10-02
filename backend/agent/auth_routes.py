"""
认证相关的 API 路由
提供登录、注册、用户管理等功能
"""

from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

from auth import (
    User, Role, Permission,
    authenticate_user, create_user, get_current_user,
    create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES,
    require_permission, require_role
)

router = APIRouter(prefix="/auth", tags=["认证"])

class Token(BaseModel):
    """令牌响应模型"""
    access_token: str
    token_type: str
    expires_in: int

class UserCreate(BaseModel):
    """用户创建模型"""
    username: str
    email: EmailStr
    password: str
    role: Optional[Role] = Role.VIEWER

class UserResponse(BaseModel):
    """用户响应模型"""
    id: str
    username: str
    email: str
    role: Role
    permissions: list[Permission]
    is_active: bool
    created_at: str
    last_login: Optional[str] = None

class UserUpdate(BaseModel):
    """用户更新模型"""
    email: Optional[EmailStr] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """用户登录"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户账户已被禁用"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # 更新最后登录时间
    user.last_login = user.created_at  # 简化处理
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """用户注册"""
    try:
        user = create_user(
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
            role=user_data.role
        )
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            permissions=user.permissions,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            last_login=user.last_login.isoformat() if user.last_login else None
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        permissions=current_user.permissions,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat(),
        last_login=current_user.last_login.isoformat() if current_user.last_login else None
    )

@router.get("/users", response_model=list[UserResponse])
async def list_users(current_user: User = Depends(require_permission(Permission.MANAGE_USERS))):
    """获取用户列表（仅管理员）"""
    from auth import USERS_DB
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            permissions=user.permissions,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            last_login=user.last_login.isoformat() if user.last_login else None
        )
        for user in USERS_DB.values()
    ]

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(require_permission(Permission.MANAGE_USERS))
):
    """更新用户信息（仅管理员）"""
    from auth import USERS_DB
    
    if user_id not in USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    user = USERS_DB[user_id]
    
    # 更新用户信息
    if user_update.email is not None:
        user.email = user_update.email
    if user_update.role is not None:
        user.role = user_update.role
        # 更新权限
        from auth import ROLE_PERMISSIONS
        user.permissions = ROLE_PERMISSIONS.get(user_update.role, [])
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        permissions=user.permissions,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
        last_login=user.last_login.isoformat() if user.last_login else None
    )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_permission(Permission.MANAGE_USERS))
):
    """删除用户（仅管理员）"""
    from auth import USERS_DB
    
    if user_id not in USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己的账户"
        )
    
    del USERS_DB[user_id]
    return {"message": "用户删除成功"}

@router.get("/permissions", response_model=list[str])
async def get_available_permissions():
    """获取所有可用权限列表"""
    return [permission.value for permission in Permission]

@router.get("/roles", response_model=list[str])
async def get_available_roles():
    """获取所有可用角色列表"""
    return [role.value for role in Role]
