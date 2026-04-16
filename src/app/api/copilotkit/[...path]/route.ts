import { handleWithGuard } from "../handler";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { pathname } = new URL(request.url);
  if (pathname.endsWith("/threads")) {
    return NextResponse.json({
      threads: [],
      message: "当前本地 CopilotKit runtime 不支持 threads 列表，已返回空结果。"
    });
  }
  return handleWithGuard(request);
}

export async function POST(request: Request) {
  return handleWithGuard(request);
}
