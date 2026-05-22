import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'mr';

    const result = await query(`
      SELECT 
        NA."Id", 
        NA."Title", 
        NA."PublishDate"
      FROM "NewsArticles" NA
      LEFT JOIN "Categories" C ON NA."CategoryId" = C."CategoryId"
      WHERE C."CategoryName" = 'विविध'
      AND NA."PublishDate" <= NOW()
      ORDER BY NA."PublishDate" DESC
      LIMIT 5
    `);

    const data = result.rows.map((r: any) => ({
      Id: r.Id,
      Title: r.Title,
      SubTitle: new Date(r.PublishDate).toLocaleDateString('mr-IN'),
    }));

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    console.error('Vividha error:', e);
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}