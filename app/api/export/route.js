import { NextResponse } from 'next/server';
import db from '@/lib/db';
import * as xlsx from 'xlsx';

export async function GET() {
  try {
    const expenses = db.prepare('SELECT date, purpose, vendor, amount FROM expenses ORDER BY date ASC').all();
    const members = db.prepare(`
      SELECT m.name, SUM(d.amount) as total_dues, SUM(CASE WHEN d.is_paid = 1 THEN d.amount ELSE 0 END) as paid
      FROM members m
      LEFT JOIN dues d ON m.id = d.member_id
      GROUP BY m.id
    `).all();

    // Create a new workbook
    const workbook = xlsx.utils.book_new();

    // Expenses Sheet
    const expensesSheet = xlsx.utils.json_to_sheet(expenses);
    xlsx.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');

    // Members Status Sheet
    const membersSheet = xlsx.utils.json_to_sheet(members.map(m => ({
      'Member Name': m.name,
      'Total Dues': m.total_dues || 0,
      'Paid Amount': m.paid || 0,
      'Unpaid Amount': (m.total_dues || 0) - (m.paid || 0)
    })));
    xlsx.utils.book_append_sheet(workbook, membersSheet, 'Members Status');

    // Generate buffer
    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="group_expenses_report.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
