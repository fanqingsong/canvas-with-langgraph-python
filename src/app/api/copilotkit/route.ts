import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

import { NextRequest } from "next/server";

// 自定义 Agent 类，直接连接到我们的 FastAPI 后端
class CustomAgent {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async invoke(input: any) {
    const response = await fetch(`${this.baseUrl}/agent/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: input.messages?.[input.messages.length - 1]?.content || "",
        thread_id: input.thread_id || "default_thread"
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      messages: [
        {
          role: "assistant",
          content: result.response
        }
      ]
    };
  }

  async *astream(input: any) {
    const response = await fetch(`${this.baseUrl}/agent/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: input.messages?.[input.messages.length - 1]?.content || "",
        thread_id: input.thread_id || "default_thread"
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent stream request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// 1. 创建服务适配器
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. 创建自定义 Agent 实例
const customAgent = new CustomAgent(process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8123");

// 3. 创建 CopilotRuntime 实例
const runtime = new CopilotRuntime({
  agents: {
    "sample_agent": customAgent,
  }
});

// 4. 构建 Next.js API 路由
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime, 
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};