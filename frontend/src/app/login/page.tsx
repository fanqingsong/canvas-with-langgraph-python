/**
 * 登录页面
 */

'use client';

import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <LoginForm
          onSuccess={() => {
            // 登录成功后跳转到主页
            window.location.href = '/';
          }}
        />
      </div>
    </div>
  );
}
