import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        "Id", 
        "Title", 
        "PublishDate"
      FROM "NewsArticles"
      WHERE "IsHero" = true
      ORDER BY "PublishDate" DESC
      LIMIT 5
    `);

    const data = result.rows.map((r: any) => ({
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