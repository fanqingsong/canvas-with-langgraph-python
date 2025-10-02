#!/usr/bin/env python3
"""
权限系统测试脚本
用于验证权限校验功能是否正常工作
"""

import requests
import json
import sys
from typing import Dict, Any

# API 基础 URL
BASE_URL = "http://localhost:8123"

def test_auth_endpoints():
    """测试认证相关端点"""
    print("=== 测试认证端点 ===")
    
    # 测试健康检查
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✓ 健康检查: {response.status_code}")
        if response.status_code == 200:
            print(f"  响应: {response.json()}")
    except Exception as e:
        print(f"✗ 健康检查失败: {e}")
        return False
    
    # 测试登录
    try:
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        print(f"✓ 管理员登录: {response.status_code}")
        
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data.get("access_token")
            print(f"  获得 token: {token[:20]}...")
            return token
        else:
            print(f"  登录失败: {response.text}")
            return None
    except Exception as e:
        print(f"✗ 登录失败: {e}")
        return None

def test_permissions_with_token(token: str):
    """使用 token 测试权限相关功能"""
    if not token:
        print("✗ 没有有效 token，跳过权限测试")
        return
    
    print("\n=== 测试权限功能 ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 测试获取当前用户信息
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"✓ 获取用户信息: {response.status_code}")
        if response.status_code == 200:
            user_info = response.json()
            print(f"  用户: {user_info['username']} ({user_info['role']})")
            print(f"  权限数量: {len(user_info['permissions'])}")
    except Exception as e:
        print(f"✗ 获取用户信息失败: {e}")
    
    # 测试权限检查
    try:
        response = requests.get(f"{BASE_URL}/permissions/check", headers=headers)
        print(f"✓ 权限检查: {response.status_code}")
        if response.status_code == 200:
            perm_info = response.json()
            print(f"  可用工具数量: {len(perm_info['available_tools'])}")
    except Exception as e:
        print(f"✗ 权限检查失败: {e}")
    
    # 测试工具权限
    try:
        response = requests.get(f"{BASE_URL}/permissions/tools", headers=headers)
        print(f"✓ 工具权限: {response.status_code}")
        if response.status_code == 200:
            tool_perms = response.json()
            print(f"  工具权限映射数量: {len(tool_perms)}")
    except Exception as e:
        print(f"✗ 工具权限检查失败: {e}")

def test_different_users():
    """测试不同用户的权限"""
    print("\n=== 测试不同用户权限 ===")
    
    users = [
        ("admin", "admin123"),
        ("editor", "editor123"),
        ("viewer", "viewer123"),
        ("guest", "guest123"),
    ]
    
    for username, password in users:
        try:
            login_data = {"username": username, "password": password}
            response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
            
            if response.status_code == 200:
                auth_data = response.json()
                token = auth_data.get("access_token")
                
                # 获取用户信息
                headers = {"Authorization": f"Bearer {token}"}
                user_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
                
                if user_response.status_code == 200:
                    user_info = user_response.json()
                    print(f"✓ {username}: {user_info['role']} ({len(user_info['permissions'])} 权限)")
                else:
                    print(f"✗ {username}: 获取用户信息失败")
            else:
                print(f"✗ {username}: 登录失败")
        except Exception as e:
            print(f"✗ {username}: 测试失败 - {e}")

def test_unauthorized_access():
    """测试未授权访问"""
    print("\n=== 测试未授权访问 ===")
    
    # 测试没有 token 的访问
    try:
        response = requests.get(f"{BASE_URL}/auth/me")
        print(f"✓ 无 token 访问 /auth/me: {response.status_code} (应该是 401)")
    except Exception as e:
        print(f"✗ 无 token 访问测试失败: {e}")
    
    # 测试无效 token 的访问
    try:
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"✓ 无效 token 访问 /auth/me: {response.status_code} (应该是 401)")
    except Exception as e:
        print(f"✗ 无效 token 访问测试失败: {e}")

def main():
    """主测试函数"""
    print("Canvas with LangGraph Python - 权限系统测试")
    print("=" * 50)
    
    # 检查服务器是否运行
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print(f"✗ 服务器响应异常: {response.status_code}")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("✗ 无法连接到服务器，请确保后端服务正在运行")
        print("  启动命令: cd backend/agent && python main.py")
        sys.exit(1)
    except Exception as e:
        print(f"✗ 连接服务器失败: {e}")
        sys.exit(1)
    
    # 执行测试
    token = test_auth_endpoints()
    test_permissions_with_token(token)
    test_different_users()
    test_unauthorized_access()
    
    print("\n" + "=" * 50)
    print("测试完成！")
    print("\n如果所有测试都通过，说明权限系统工作正常。")
    print("如果测试失败，请检查：")
    print("1. 后端服务是否正在运行")
    print("2. 环境变量 JWT_SECRET_KEY 是否设置")
    print("3. 依赖包是否正确安装")

if __name__ == "__main__":
    main()
