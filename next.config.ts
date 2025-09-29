import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用 standalone 输出模式，用于 Docker 部署
  output: 'standalone',
  
  // 配置环境变量
  env: {
    NEXT_PUBLIC_AGENT_URL: process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8123',
  },
  
  // 配置重写规则，用于 API 代理
  async rewrites() {
    return [
      {
        source: '/api/agent/:path*',
        destination: `${process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8123'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
