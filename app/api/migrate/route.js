import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Starting manual migration for items column...');
    const result = await sql`ALTER TABLE expenses ADD COLUMN items TEXT`;
    return NextResponse.json({ success: true, message: 'Column items added successfully', result });
  } catch (err) {
    console.error('Migration error:', err.message);
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      isAlreadyExists: err.message.includes('already exists')
    });
  }
}
