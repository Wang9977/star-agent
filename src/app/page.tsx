"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotChat } from "@copilotkit/react-core";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Providers from "./providers";
import { useThreads } from "@/hooks/useThreads";

type ChatLayoutProps = {
  currentThreadId: string;
  onChangeThreadId: (threadId: string) => void;
};

function ChatLayout({ currentThreadId, onChangeThreadId }: ChatLayoutProps) {
  const { threads, isLoading, error, refreshThreads, saveThread } = useThreads();
  const { messages: chatMessages } = useCopilotChat();
  const lastSavedRef = useRef<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const currentMessagesKey = JSON.stringify(chatMessages);
    
    if (chatMessages.length === 0 || currentMessagesKey === lastSavedRef.current || isSaving) {
      return;
    }
    
    const userMessages = chatMessages.filter((m: any) => m.role === "user");
    if (userMessages.length === 0) {
      return;
    }
    
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const firstMessage = userMessages[0].content;
        const name = firstMessage.slice(0, 20);
        const formattedMessages = chatMessages.map((m: any) => ({
          role: m.role,
          content: m.content,
        }));
        await saveThread(currentThreadId, name, formattedMessages);
        lastSavedRef.current = currentMessagesKey;
      } finally {
        setIsSaving(false);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [chatMessages, currentThreadId, saveThread, isSaving]);

  const handleCreateThread = useCallback(async () => {
    if (chatMessages.length > 0) {
      const userMessages = chatMessages.filter((m: any) => m.role === "user");
      if (userMessages.length > 0) {
        const firstMessage = userMessages[0].content;
        const name = firstMessage.slice(0, 20);
        const formattedMessages = chatMessages.map((m: any) => ({
          role: m.role,
          content: m.content,
        }));
        await saveThread(currentThreadId, name, formattedMessages);
      }
    }
    
    const newId = crypto.randomUUID();
    onChangeThreadId(newId);
    lastSavedRef.current = "";
  }, [chatMessages, currentThreadId, onChangeThreadId, saveThread]);

  const sortedThreads = useMemo(
    () =>
      [...threads].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [threads],
  );

  const currentThreadTitle = useMemo(() => {
    const current = sortedThreads.find((thread) => thread.id === currentThreadId);
    if (!current) return "新会话";
    return current.name || `会话 ${current.id.slice(0, 8)}`;
  }, [currentThreadId, sortedThreads]);

  const handleCreateThread = () => {
    onChangeThreadId(crypto.randomUUID());
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl p-4 md:p-6">
      <div className="flex h-[calc(100vh-2rem)] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#111831] shadow-2xl shadow-black/30 md:h-[calc(100vh-3rem)]">
        <aside className="flex w-80 shrink-0 flex-col border-r border-white/10 bg-[#0f172d]">
          <div className="border-b border-white/10 p-4">
            <button
              onClick={handleCreateThread}
              className="w-full rounded-xl bg-[#2d7ff9] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1f6fe8]"
            >
              + 新建对话
            </button>
          </div>
          <div className="px-4 pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">历史对话</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {isLoading && <p className="px-2 py-3 text-sm text-slate-400">正在加载会话...</p>}
            {error && (
              <p className="px-2 py-3 text-sm text-rose-300">
                会话加载失败：{error || "请检查 CopilotKit 接口配置"}
              </p>
            )}
            {!isLoading && !error && sortedThreads.length === 0 && (
              <p className="px-2 py-3 text-sm text-slate-400">暂无历史会话</p>
            )}
            <div className="space-y-2">
              {sortedThreads.map((thread) => {
                const active = thread.id === currentThreadId;
                const title = thread.name || `会话 ${thread.id.slice(0, 8)}`;
                const preview = `更新于 ${new Date(thread.updatedAt).toLocaleString("zh-CN")}`;
                return (
                  <button
                    key={thread.id}
                    onClick={() => onChangeThreadId(thread.id)}
                    className={`w-full rounded-xl px-3 py-3 text-left transition ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <p className="truncate text-sm font-medium">{title}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">{preview}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[#111831]">
          <header className="border-b border-white/10 px-5 py-4">
            <h1 className="text-base font-semibold text-slate-100">Gemini 风格 AI 对话</h1>
            <p className="mt-1 text-sm text-slate-400">当前会话：{currentThreadTitle}</p>
          </header>
          <div className="min-h-0 flex-1 p-4">
            <div className="h-full rounded-2xl border border-white/10 bg-[#0d152b] p-3">
              <CopilotChat
                key={currentThreadId}
                className="h-full"
                instructions="你是一个专业、简洁、友好的中文 AI 助手。"
                labels={{
                  title: "AI 助手",
                  initial: "你好！我可以帮你写代码、解释概念、生成方案。",
                  placeholder: "请输入你的问题..."
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function HomePage() {
  const [threadId, setThreadId] = useState<string>(() => crypto.randomUUID());

  return (
    <Providers threadId={threadId}>
      <ChatLayout currentThreadId={threadId} onChangeThreadId={setThreadId} />
    </Providers>
  );
}
