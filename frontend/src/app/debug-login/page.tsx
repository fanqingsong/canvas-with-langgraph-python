'use client';

import { useState } from 'react';

export default function DebugLoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testLogin = async () => {
    try {
      setError(null);
      setResult(null);

      // 测试登录
      console.log('Testing login...');
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const loginResponse = await fetch('http://localhost:8123/auth/login', {
        method: 'POST',
        body: formData,
      });

      console.log('Login response status:', loginResponse.status);
      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);

      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginData.detail || 'Unknown error'}`);
      }

      // 存储 token
      localStorage.setItem('access_token', loginData.access_token);
      console.log('Token stored:', loginData.access_token);

      // 测试获取用户信息
      console.log('Testing getCurrentUser...');
      const userResponse = await fetch('http://localhost:8123/auth/me', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`,
        },
      });

      console.log('User response status:', userResponse.status);
      const userData = await userResponse.json();
      console.log('User response:', userData);

      if (!userResponse.ok) {
        throw new Error(`Get user failed: ${userData.detail || 'Unknown error'}`);
      }

      setResult({
        login: loginData,
        user: userData,
      });

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Debug Login
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <button
              onClick={testLogin}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Test Login
            </button>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {result && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <h3 className="font-bold">Success!</h3>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
