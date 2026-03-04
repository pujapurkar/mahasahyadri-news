import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDB();
    const result = await db.request().query(
      'SELECT CategoryId, CategoryName FROM Categories ORDER BY CategoryName'
    );
    return NextResponse.json({ status: 'OK', data: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message, data: [] });
  }
}