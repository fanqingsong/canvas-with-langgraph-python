import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  LangGraphHttpAgent,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

// 使用 ExperimentalEmptyAdapter 作为服务适配器
const serviceAdapter = new ExperimentalEmptyAdapter();

const runtime = new CopilotRuntime({
  agents: {
    // 连接到 FastAPI 后端的 LangGraph agent
    'sample_agent': new LangGraphHttpAgent({
      url: process.env.LANGGRAPH_URL || "http://localhost:8123"
    }),
  },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};