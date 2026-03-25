import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();
    const expenses = await sql`
      SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC
    `;
    const formatted = expenses.map(e => ({
      ...e,
      expense_date: new Date(e.expense_date).toISOString().split('T')[0]
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const sql = getDb();
    const { amount, purpose, vendor, expense_date } = await request.json();
    if (!amount || !purpose || !expense_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO expenses (amount, purpose, vendor, expense_date)
      VALUES (${amount}, ${purpose}, ${vendor || ''}, ${expense_date})
      RETURNING id
    `;

    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await sql`DELETE FROM expenses WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
