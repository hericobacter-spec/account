import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();
    const members = await sql`SELECT * FROM members ORDER BY created_at ASC`;
    const membersData = await Promise.all(members.map(async (m) => {
      const dues = await sql`SELECT * FROM dues WHERE member_id = ${m.id}`;
      const totalAmount = dues.reduce((sum, d) => sum + d.amount, 0);
      const paidAmount = dues.reduce((sum, d) => d.is_paid ? sum + d.amount : sum, 0);
      const unpaidCount = dues.filter(d => !d.is_paid).length;
      return {
        '멤버명': m.name,
        '청구된 총액': totalAmount,
        '납입 완료 금액': paidAmount,
        '미납 금액': totalAmount - paidAmount,
        '미납 건수': unpaidCount
      };
    }));

    const wb = XLSX.utils.book_new();
    const membersWs = XLSX.utils.json_to_sheet(membersData);
    XLSX.utils.book_append_sheet(wb, membersWs, '멤버 입금 현황');

    const expenses = await sql`SELECT * FROM expenses ORDER BY expense_date DESC`;
    const expensesData = expenses.map(e => ({
      '사용 일자': new Date(e.expense_date).toISOString().split('T')[0],
      '지출 목적': e.purpose,
      '지출처': e.vendor || '',
      '결제 금액': e.amount
    }));
    
    if (expensesData.length > 0) {
      const expensesWs = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, expensesWs, '지출 내역');
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="group_report.xlsx"'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
