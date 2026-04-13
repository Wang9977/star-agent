import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CopilotKit AI 助手",
  description: "基于 CopilotKit 构建的 AI 助手示例"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
