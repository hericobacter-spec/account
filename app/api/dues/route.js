import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const sql = getDb();
    const { member_id, amount, due_date } = await request.json();
    if (!member_id || !amount || !due_date) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await sql`
      INSERT INTO dues (member_id, amount, due_date, is_paid)
      VALUES (${member_id}, ${amount}, ${due_date}, false)
    `;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const sql = getDb();
    const { id, is_paid } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await sql`
      UPDATE dues SET is_paid = ${Boolean(is_paid)} WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
