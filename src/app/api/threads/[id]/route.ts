import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    
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
