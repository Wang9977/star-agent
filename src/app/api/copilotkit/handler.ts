import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint
} from "@copilotkit/runtime";
import { NextResponse } from "next/server";

function getRuntimeHandler() {
  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!googleApiKey) {
    throw new Error(
      "缺少环境变量 GOOGLE_API_KEY（或 GEMINI_API_KEY），请在 .env.local 中配置后重启 dev server。",
    );
  }

  const serviceAdapter = new GoogleGenerativeAIAdapter({
    apiKey: googleApiKey,
    model: "gemini-1.5-flash"
  });
  const runtime = new CopilotRuntime();

  return copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit"
  }).handleRequest;
}

export async function handleWithGuard(request: Request) {
  try {
    const handleRequest = getRuntimeHandler();
    return await handleRequest(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown runtime error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
