# CopilotKit 会话管理功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 CopilotKit 添加会话历史管理功能，支持自动保存对话到 SQLite并在左侧栏显示历史会话列表

**Architecture:** 使用 SQLite (better-sqlite3) 存储会话和消息，后端提供 REST API，前端通过 hook 调用

**Tech Stack:** SQLite (better-sqlite3), Next.js API Routes, React hooks

---

## 文件结构

```
src/app/api/
├── threads/
│   └── route.ts          # GET 列表, POST 创建/保存
└── copilotkit/
    └── route.ts          # 已有

src/lib/
└── db.ts                 # 数据库初始化和操作

src/hooks/
└── useThreads.ts         # 会话管理 hook
```

---

### Task 1: 安装依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 添加 better-sqlite3 依赖**

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

---

### Task 2: 创建数据库模块

**Files:**
- Create: `src/lib/db.ts`

- [ ] **Step 1: 创建数据库初始化模块**

```typescript
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'threads.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeTables(db);
  }
  return db;
}

function initializeTables(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (thread_id) REFERENCES threads(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
  `);
}

export interface Thread {
  id: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db.ts package.json package-lock.json
git commit -m "feat: add SQLite database module for thread management"
```

---

### Task 3: 实现 GET /api/threads 接口

**Files:**
- Create: `src/app/api/threads/route.ts`

- [ ] **Step 1: 创建 threads API 路由**

```typescript
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const threads = db.prepare(`
      SELECT id, name, created_at as createdAt, updated_at as updatedAt
      FROM threads
      ORDER BY updated_at DESC
    `).all() as any[];
    
    return NextResponse.json({ threads });
  } catch (error) {
    console.error('Failed to fetch threads:', error);
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
  }
}
```

---

### Task 4: 实现 POST /api/threads 接口

**Files:**
- Modify: `src/app/api/threads/route.ts`

- [ ] **Step 1: 添加 POST 处理器**

在 `src/app/api/threads/route.ts` 中添加:

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, messages } = body;
    
    const db = getDb();
    const now = new Date().toISOString();
    
    // 如果提供了 id，检查是否已存在
    const existing = id ? db.prepare('SELECT id FROM threads WHERE id = ?').get(id) : null;
    
    if (existing) {
      // 更新现有 thread
      db.prepare(`
        UPDATE threads 
        SET name = COALESCE(?, name), updated_at = ?
        WHERE id = ?
      `).run(name, now, id);
      
      // 删除旧消息并插入新消息
      db.prepare('DELETE FROM messages WHERE thread_id = ?').run(id);
      
      if (messages && messages.length > 0) {
        const insertMsg = db.prepare(`
          INSERT INTO messages (thread_id, role, content, created_at)
          VALUES (?, ?, ?, ?)
        `);
        
        for (const msg of messages) {
          insertMsg.run(id, msg.role, msg.content, now);
        }
      }
    } else {
      // 创建新 thread
      const threadId = id || crypto.randomUUID();
      const threadName = name || null;
      
      db.prepare(`
        INSERT INTO threads (id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(threadId, threadName, now, now);
      
      // 插入消息
      if (messages && messages.length > 0) {
        const insertMsg = db.prepare(`
          INSERT INTO messages (thread_id, role, content, created_at)
          VALUES (?, ?, ?, ?)
        `);
        
        for (const msg of messages) {
          insertMsg.run(threadId, msg.role, msg.content, now);
        }
      }
      
      return NextResponse.json({
        thread: {
          id: threadId,
          name: threadName,
          createdAt: now,
          updatedAt: now
        }
      });
    }
    
    return NextResponse.json({
      thread: {
        id,
        name,
        createdAt: now,
        updatedAt: now
      }
    });
  } catch (error) {
    console.error('Failed to save thread:', error);
    return NextResponse.json({ error: 'Failed to save thread' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/threads/route.ts
git commit -m "feat: add POST /api/threads for creating/saving sessions"
```

---

### Task 5: 实现 GET /api/threads/[id] 接口

**Files:**
- Create: `src/app/api/threads/[id]/route.ts`

- [ ] **Step 1: 创建单个 thread 获取接口**

```typescript
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    
    const thread = db.prepare(`
      SELECT id, name, created_at as createdAt, updated_at as updatedAt
      FROM threads WHERE id = ?
    `).get(id) as any;
    
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }
    
    const messages = db.prepare(`
      SELECT role, content
      FROM messages
      WHERE thread_id = ?
      ORDER BY id ASC
    `).all(id) as any[];
    
    return NextResponse.json({ thread, messages });
  } catch (error) {
    console.error('Failed to fetch thread:', error);
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/threads/\[id\]/route.ts
git commit -m "feat: add GET /api/threads/[id] for fetching session details"
```

---

### Task 6: 创建 useThreads Hook

**Files:**
- Create: `src/hooks/useThreads.ts`

- [ ] **Step 1: 创建会话管理 Hook**

```typescript
"use client";

import { useState, useCallback, useEffect } from "react";

export interface Thread {
  id: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseThreadsResult {
  threads: Thread[];
  isLoading: boolean;
  error: string | null;
  refreshThreads: () => Promise<void>;
  createThread: (id?: string, name?: string, messages?: { role: string; content: string }[]) => Promise<Thread | null>;
  saveThread: (id: string, name: string | null, messages: { role: string; content: string }[]) => Promise<Thread | null>;
}

export function useThreads(): UseThreadsResult {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshThreads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/threads");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      setThreads(Array.isArray(payload?.threads) ? payload.threads : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load threads");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createThread = useCallback(async (
    id?: string,
    name?: string,
    messages?: { role: string; content: string }[]
  ): Promise<Thread | null> => {
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, messages }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const payload = await response.json();
      await refreshThreads();
      return payload.thread;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create thread");
      return null;
    }
  }, [refreshThreads]);

  const saveThread = useCallback(async (
    id: string,
    name: string | null,
    messages: { role: string; content: string }[]
  ): Promise<Thread | null> => {
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, messages }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const payload = await response.json();
      await refreshThreads();
      return payload.thread;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save thread");
      return null;
    }
  }, [refreshThreads]);

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  return { threads, isLoading, error, refreshThreads, createThread, saveThread };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useThreads.ts
git commit -m "feat: add useThreads hook for session management"
```

---

### Task 7: 修改前端 ChatLayout

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 修改 ChatLayout 组件实现会话管理**

修改 `ChatLayout` 函数:

```typescript
// 替换现有的 threads state 和 fetch 逻辑
const { threads, isLoading, error, refreshThreads, createThread, saveThread } = useThreads();

// 修改 handleCreateThread 函数
const handleCreateThread = useCallback(async () => {
  // 获取当前 CopilotKit 的消息并保存
  // 这里需要通过 CopilotKit 的 context 获取消息
  // 先创建一个新 ID，然后刷新列表
  const newId = crypto.randomUUID();
  onChangeThreadId(newId);
  await refreshThreads();
}, [onChangeThreadId, refreshThreads]);
```

- [ ] **Step 2: 添加消息保存逻辑**

需要在 CopilotKit 消息发送后自动保存。这需要使用 CopilotKit 的 `useCopilotChat` hook 拦截消息:

```typescript
import { useCopilotChat } from "@copilotkit/react-core";

// 在 ChatLayout 组件中添加
const { messages: chatMessages } = useCopilotChat();

// 当 chatMessages 变化时保存
useEffect(() => {
  if (chatMessages.length > 0 && currentThreadId) {
    const userMessages = chatMessages.filter((m: any) => m.role === "user");
    if (userMessages.length > 0) {
      const firstMessage = userMessages[0].content;
      const name = firstMessage.slice(0, 20);
      const formattedMessages = chatMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
      }));
      saveThread(currentThreadId, name, formattedMessages);
    }
  }
}, [chatMessages, currentThreadId, saveThread]);
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: integrate session management in ChatLayout"
```

---

### Task 8: 测试

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev
```

- [ ] **Step 2: 测试 API**

```bash
# 获取线程列表
curl http://localhost:3000/api/threads

# 创建新线程
curl -X POST http://localhost:3000/api/threads \
  -H "Content-Type: application/json" \
  -d '{"name": "测试会话", "messages": [{"role": "user", "content": "你好"}]}'

# 获取指定线程
curl http://localhost:3000/api/threads/{threadId}
```

- [ ] **Step 3: 测试前端**
- 打开 http://localhost:3000
- 点击"新建对话"
- 发送消息，检查是否自动保存
- 刷新页面，检查历史会话是否显示

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-16-copilotkit-session-management.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
