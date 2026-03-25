import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows: members } = await sql`SELECT * FROM members ORDER BY created_at DESC`;
    
    const membersWithDues = await Promise.all(members.map(async (member) => {
      const { rows: dues } = await sql`SELECT * FROM dues WHERE member_id = ${member.id}`;
      
      const totalAmount = dues.reduce((sum, d) => sum + d.amount, 0);
      const paidAmount = dues.reduce((sum, d) => d.is_paid ? sum + d.amount : sum, 0);
      const unpaidCount = dues.filter(d => !d.is_paid).length;
      
      // format dates nicely for postgres object
      const formattedDues = dues.map(d => ({
        ...d,
        due_date: new Date(d.due_date).toISOString().split('T')[0]
      }));

      return { ...member, dues: formattedDues, totalAmount, paidAmount, unpaidCount };
    }));

    return NextResponse.json(membersWithDues);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, dueAmount, isPaid } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const { rows } = await sql`INSERT INTO members (name) VALUES (${name}) RETURNING id`;
    const memberId = rows[0].id;

    if (dueAmount) {
      const today = new Date().toISOString().split('T')[0];
      await sql`
        INSERT INTO dues (member_id, amount, due_date, is_paid) 
        VALUES (${memberId}, ${Number(dueAmount)}, ${today}, ${Boolean(isPaid)})
      `;
    }

    return NextResponse.json({ id: memberId, name }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
