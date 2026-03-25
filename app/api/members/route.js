import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const members = db.prepare('SELECT * FROM members ORDER BY created_at DESC').all();
    
    // Also fetch their dues summary (total dues, and if any are unpaid)
    const membersWithDues = members.map(member => {
      const dues = db.prepare('SELECT * FROM dues WHERE member_id = ?').all(member.id);
      const totalAmount = dues.reduce((sum, d) => sum + d.amount, 0);
      const paidAmount = dues.reduce((sum, d) => d.is_paid === 1 ? sum + d.amount : sum, 0);
      const unpaidCount = dues.filter(d => d.is_paid === 0).length;
      return { ...member, dues, totalAmount, paidAmount, unpaidCount };
    });

    return NextResponse.json(membersWithDues);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const info = db.prepare('INSERT INTO members (name) VALUES (?)').run(name);
    return NextResponse.json({ id: info.lastInsertRowid, name }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
