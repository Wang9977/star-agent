"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import Providers from "./providers";

export default function HomePage() {
  return (
    <Providers>
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center p-6">
        <div className="h-[75vh] w-full rounded-2xl border border-white/10 bg-[#111831] p-4 shadow-2xl shadow-black/30">
          <CopilotChat
            className="h-full"
            instructions="你是一个专业、简洁、友好的中文 AI 助手。"
            labels={{
              title: "CopilotKit AI 助手",
              initial: "你好！我可以帮你写代码、解释概念、生成方案。",
              placeholder: "请输入你的问题..."
            }}
          />
        </div>
      </main>
    </Providers>
  );
}
