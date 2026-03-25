import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const { member_id, amount, due_date } = await request.json();
    if (!member_id || amount == null || !due_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const info = db.prepare(`
      INSERT INTO dues (member_id, amount, due_date, is_paid)
      VALUES (?, ?, ?, 0)
    `).run(member_id, amount, due_date);

    return NextResponse.json({ id: info.lastInsertRowid }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  // To update payment status
  try {
    const { id, is_paid } = await request.json();
    if (!id || typeof is_paid === 'undefined') {
      return NextResponse.json({ error: 'Missing id or is_paid' }, { status: 400 });
    }

    db.prepare('UPDATE dues SET is_paid = ? WHERE id = ?').run(is_paid ? 1 : 0, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
