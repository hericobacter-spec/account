import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC
    `;
    const expenses = result.rows || [];
    
    console.log(`Fetched ${expenses.length} expenses from DB`);

    const formatted = expenses.map(e => {
      // Robust date formatting to prevent 500 errors
      let dateStr = '';
      try {
        dateStr = new Date(e.expense_date).toISOString().split('T')[0];
      } catch (err) {
        console.error('Date parsing error for expense:', e.id, e.expense_date);
        dateStr = String(e.expense_date);
      }

      return {
        ...e,
        date: dateStr,
        expense_date: dateStr
      };
    });
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('GET Expenses Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, purpose, vendor, items, date, expense_date, receipt_image, receipt_images } = body;
    
    const finalDate = expense_date || date;
    const imagePayload = Array.isArray(receipt_images)
      ? JSON.stringify(receipt_images)
      : receipt_image || null;

    console.log('Inserting expense:', { amount, purpose, vendor, date: finalDate, imageCount: Array.isArray(receipt_images) ? receipt_images.length : receipt_image ? 1 : 0 });
    
    if (!amount || !purpose || !finalDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO expenses (amount, purpose, vendor, items, expense_date, receipt_image)
      VALUES (${Number(amount)}, ${purpose}, ${vendor || ''}, ${items || null}, ${finalDate}, ${imagePayload})
      RETURNING id, amount, purpose
    `;

    console.log('Insert result:', result.rows?.[0]);

    return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    console.error('POST Expense Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await sql`DELETE FROM expenses WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
