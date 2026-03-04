import { NextResponse } from 'next/server';
import { getDB, sql } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDB();
    const result = await db.request().query(`
      SELECT TOP 5 Title
      FROM NewsArticles
      WHERE DATEADD(MINUTE, BreakingDurationMinutes, PublishDate) > GETDATE()
      AND BreakingDurationMinutes > 0
      ORDER BY PublishDate DESC
    `);

    const data = result.recordset.length > 0 
      ? result.recordset.map((r: any) => r.Title)
      : ['कोणत्याही ब्रेकिंग न्यूज नाहीत'];

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message, data: [] });
  }
}