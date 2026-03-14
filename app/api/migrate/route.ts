import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDB();
    const result = await db.request().query(`
      SELECT TOP 5 
        Id, 
        Title, 
        PublishDate
      FROM NewsArticles
      WHERE IsHero = 1
      ORDER BY PublishDate DESC
    `);

    const data = result.recordset.map((r: any) => ({
      Id: r.Id,
      Title: r.Title,
      SubTitle: new Date(r.PublishDate).toLocaleDateString('mr-IN'),
    }));

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    console.error('Heroes error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}