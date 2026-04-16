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