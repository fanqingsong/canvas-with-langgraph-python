import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  LangGraphHttpAgent,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

// 自定义的 LangGraph Agent，支持认证
class AuthenticatedLangGraphAgent extends LangGraphHttpAgent {
  private authToken: string | null = null;

  constructor(url: string, authToken?: string) {
    super({ 
      url,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    this.authToken = authToken || null;
  }

  // 重写请求方法以添加认证头
  async request(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // 使用传入的认证 token
    console.log("CopilotKit API 认证 token:", this.authToken);

    // 添加认证头到请求中
    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
      ...init?.headers,
    };

    return super.request(input, {
      ...init,
      headers,
    });
  }

  // 重写invoke方法以传递认证信息到config
  async invoke(input: any, config?: any): Promise<any> {
    console.log("LangGraph Agent invoke - 传递认证信息到config");
    console.log("原始input:", input);
    console.log("原始config:", config);
    console.log("认证token:", this.authToken);
    
    // 确保有thread_id，如果没有则生成一个
    const threadId = config?.configurable?.thread_id || `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 将认证信息添加到config中
    const authConfig = {
      ...config,
      configurable: {
        ...config?.configurable,
        thread_id: threadId,
        authorization: this.authToken ? `Bearer ${this.authToken}` : null
      }
    };

    console.log("LangGraph config with auth:", authConfig);

    return super.invoke(input, authConfig);
  }

  // 重写stream方法以传递认证信息到config
  async stream(input: any, config?: any): Promise<any> {
    console.log("LangGraph Agent stream - 传递认证信息到config");
    console.log("原始input:", input);
    console.log("原始config:", config);
    console.log("认证token:", this.authToken);
    
    // 确保有thread_id，如果没有则生成一个
    const threadId = config?.configurable?.thread_id || `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 将认证信息添加到config中
    const authConfig = {
      ...config,
      configurable: {
        ...config?.configurable,
        thread_id: threadId,
        authorization: this.authToken ? `Bearer ${this.authToken}` : null
      }
    };

    console.log("LangGraph stream config with auth:", authConfig);

    return super.stream(input, authConfig);
  }
}

// 使用 ExperimentalEmptyAdapter 作为服务适配器
const serviceAdapter = new ExperimentalEmptyAdapter();

export const POST = async (req: NextRequest) => {
  // 从请求头中提取认证信息
  const authHeader = req.headers.get('authorization');
  const authToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  console.log("CopilotKit API 收到的认证头:", authHeader);
  console.log("提取的 token:", authToken);

  // 创建带认证的 runtime
  const runtime = new CopilotRuntime({
    agents: {
      // 使用带认证的 LangGraph agent
      'sample_agent': new AuthenticatedLangGraphAgent(
        (process.env.LANGGRAPH_URL || "http://localhost:8123") + "/langgraph",
        authToken || undefined
      ),
    },
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};