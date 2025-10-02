/**
 * 认证上下文，提供全局认证状态管理
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthAPI, PermissionCheck, hasPermission, hasRole } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  permissions: PermissionCheck | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  checkPermission: (permission: string) => boolean;
  checkRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<PermissionCheck | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      if (AuthAPI.isAuthenticated()) {
        try {
          const storedUser = AuthAPI.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            // 验证 token 是否仍然有效
            await refreshUser();
          }
        } catch (error) {
          console.error('认证初始化失败:', error);
          AuthAPI.logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const authResponse = await AuthAPI.login({ username, password });
      
      // 先存储 token，然后再获取用户信息
      localStorage.setItem('access_token', authResponse.access_token);
      
      // 直接使用 token 获取用户信息，避免 localStorage 异步问题
      const userInfo = await AuthAPI.getCurrentUserWithToken(authResponse.access_token);
      
      AuthAPI.storeAuthData(authResponse, userInfo);
      setUser(userInfo);
      
      // 获取权限信息
      const permissionInfo = await AuthAPI.checkPermissions();
      setPermissions(permissionInfo);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, role = 'viewer') => {
    try {
      setIsLoading(true);
      const userInfo = await AuthAPI.register({ username, email, password, role });
      
      // 注册成功后自动登录
      await login(username, password);
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthAPI.logout();
    setUser(null);
    setPermissions(null);
  };

  const refreshUser = async () => {
    try {
      const userInfo = await AuthAPI.getCurrentUser();
      setUser(userInfo);
      
      // 更新本地存储
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      
      // 获取权限信息
      const permissionInfo = await AuthAPI.checkPermissions();
      setPermissions(permissionInfo);
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      logout();
    }
  };

  const checkPermission = (permission: string): boolean => {
    return hasPermission(user, permission);
  };

  const checkRole = (role: string): boolean => {
    return hasRole(user, role);
  };

  const value: AuthContextType = {
    user,
    permissions,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    checkPermission,
    checkRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
