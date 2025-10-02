'use client';

import { CopilotKit } from '@copilotkit/react-core';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface AuthenticatedCopilotKitProps {
  children: React.ReactNode;
}

export function AuthenticatedCopilotKit({ children }: AuthenticatedCopilotKitProps) {
  const { user, isAuthenticated } = useAuth();
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [properties, setProperties] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('access_token');
      console.log('AuthenticatedCopilotKit: 设置认证信息', { token: token ? `${token.substring(0, 20)}...` : 'null' });
      
      setHeaders({
        'Authorization': token ? `Bearer ${token}` : '',
      });
      setProperties({
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'authorization': token ? `Bearer ${token}` : null, // 确保格式正确
      });
    } else {
      console.log('AuthenticatedCopilotKit: 用户未认证，清除认证信息');
      setHeaders({});
      setProperties({});
    }
  }, [isAuthenticated, user]);

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="sample_agent"
      showDevConsole={false}
      headers={headers}
      properties={properties}
    >
      {children}
    </CopilotKit>
  );
}
