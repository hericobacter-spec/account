import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC, created_at DESC').all();
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { date, purpose, items, vendor, amount, receipt_image_url } = await request.json();
    if (!date || !purpose || amount == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const info = db.prepare(`
      INSERT INTO expenses (date, purpose, items, vendor, amount, receipt_image_url) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(date, purpose, items || null, vendor || null, amount, receipt_image_url || null);

    return NextResponse.json({ id: info.lastInsertRowid }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
