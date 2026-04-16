import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, messages } = body;
    
    const db = await getDb();
    const now = new Date().toISOString();
    
    const existing = id ? db.prepare('SELECT id FROM threads WHERE id = ?').get(id) : null;
    
    if (existing) {
      db.prepare(`
        UPDATE threads 
        SET name = COALESCE(?, name), updated_at = ?
        WHERE id = ?
      `).run(name, now, id);
      
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
      const threadId = id || crypto.randomUUID();
      const threadName = name || null;
      
      db.prepare(`
        INSERT INTO threads (id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(threadId, threadName, now, now);
      
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