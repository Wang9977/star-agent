# CopilotKit 会话管理功能设计

## 概述

为 CopilotKit 添加会话历史管理功能，支持：
- 自动保存对话到 SQLite
- 左侧栏显示历史会话列表
- 新建会话时自动保存当前会话

## 技术栈

- **数据库**: SQLite (better-sqlite3)
- **存储位置**: `data/threads.db`

## 数据库设计

### threads 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | 线程 ID |
| name | TEXT | 会话名称（首条用户消息） |
| created_at | TEXT | 创建时间 ISO8601 |
| updated_at | TEXT | 更新时间 ISO8601 |

### messages 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 自增 ID |
| thread_id | TEXT | 关联线程 ID |
| role | TEXT | user / assistant |
| content | TEXT | 消息内容 |
| created_at | TEXT | 创建时间 ISO8601 |

## API 设计

### GET /api/threads
获取会话列表

**响应:**
```json
{
  "threads": [
    {
      "id": "uuid",
      "name": "会话名称",
      "createdAt": "2024-01-15T14:30:00Z",
      "updatedAt": "2024-01-15T14:35:00Z"
    }
  ]
}
```

### POST /api/threads
创建新会话 或 保存现有会话

**请求体:**
```json
{
  "id": "uuid",           // 可选，不提供则创建新会话
  "name": "会话名称",      // 可选，自动生成
  "messages": [
    { "role": "user", "content": "用户消息" },
    { "role": "assistant", "content": "AI回复" }
  ]
}
```

**响应:**
```json
{
  "thread": {
    "id": "uuid",
    "name": "会话名称",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### GET /api/threads/[threadId]
获取指定会话详情（包含消息）

**响应:**
```json
{
  "thread": {
    "id": "uuid",
    "name": "会话名称",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "messages": [
    { "role": "user", "content": "用户消息" },
    { "role": "assistant", "content": "AI回复" }
  ]
}
```

## 前端设计

### 组件结构
- `ChatLayout` - 主布局，包含侧边栏和聊天区
- `ThreadList` - 左侧会话列表（已有，需修改）
- `useThreads` - 会话管理 hook

### 数据流
1. 用户发送消息 → CopilotKit 处理
2. 拦截消息，保存到 SQLite
3. 前端刷新 threads 列表

### 新建会话逻辑
1. 用户点击"新建对话"
2. 先调用 POST /api/threads 保存当前会话（传入当前 threadId 和消息）
3. 创建新 threadId（crypto.randomUUID()）
4. 清空聊天界面，切换到新 threadId

## 待办

- [ ] 创建数据库模块 (db.ts)
- [ ] 实现 GET /api/threads 接口
- [ ] 实现 POST /api/threads 接口
- [ ] 实现 GET /api/threads/[id] 接口
- [ ] 修改前端 ChatLayout 实现会话管理
- [ ] 消息发送后自动保存逻辑
