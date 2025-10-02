/**
 * 认证相关的工具函数和类型定义
 */

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PermissionCheck {
  user: {
    username: string;
    role: string;
    permissions: string[];
  };
  available_tools: string[];
}

// API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8123';

// 认证 API 函数
export class AuthAPI {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '登录失败');
    }

    return response.json();
  }

  static async register(data: RegisterData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '注册失败');
    }

    return response.json();
  }

  static async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token 过期或无效，清除本地存储
        this.logout();
        throw new Error('认证失败，请重新登录');
      }
      throw new Error('获取用户信息失败');
    }

    return response.json();
  }

  static async getCurrentUserWithToken(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token 过期或无效，清除本地存储
        this.logout();
        throw new Error('认证失败，请重新登录');
      }
      throw new Error('获取用户信息失败');
    }

    return response.json();
  }

  static async checkPermissions(): Promise<PermissionCheck> {
    const response = await fetch(`${API_BASE_URL}/permissions/check`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('获取权限信息失败');
    }

    return response.json();
  }

  static async getToolPermissions(): Promise<Record<string, { required_permission: string; has_permission: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/permissions/tools`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('获取工具权限失败');
    }

    return response.json();
  }

  static logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    window.location.href = '/login';
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  static getStoredUser(): User | null {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  static storeAuthData(authResponse: AuthResponse, user: User): void {
    localStorage.setItem('access_token', authResponse.access_token);
    localStorage.setItem('user_info', JSON.stringify(user));
  }
}

// 权限检查工具函数
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false;
  return user.role === role || user.role === 'admin';
}

export function canAccessTool(user: User | null, toolName: string, toolPermissions: Record<string, { has_permission: boolean }>): boolean {
  if (!user) return false;
  const toolPermission = toolPermissions[toolName];
  return toolPermission ? toolPermission.has_permission : true;
}

// 权限常量
export const PERMISSIONS = {
  READ_CANVAS: 'read:canvas',
  WRITE_CANVAS: 'write:canvas',
  DELETE_CANVAS: 'delete:canvas',
  CREATE_PROJECT: 'create:project',
  EDIT_PROJECT: 'edit:project',
  DELETE_PROJECT: 'delete:project',
  CREATE_ENTITY: 'create:entity',
  EDIT_ENTITY: 'edit:entity',
  DELETE_ENTITY: 'delete:entity',
  CREATE_NOTE: 'create:note',
  EDIT_NOTE: 'edit:note',
  DELETE_NOTE: 'delete:note',
  CREATE_CHART: 'create:chart',
  EDIT_CHART: 'edit:chart',
  DELETE_CHART: 'delete:chart',
  CREATE_PLAN: 'create:plan',
  EXECUTE_PLAN: 'execute:plan',
  MANAGE_PLAN: 'manage:plan',
  ADMIN: 'admin',
  MANAGE_USERS: 'manage:users',
} as const;

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
  GUEST: 'guest',
} as const;
