import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'mr';

    const result = await query(`
      SELECT "Title"
      FROM "NewsArticles"
      WHERE "PublishDate" <= NOW()
      AND "BreakingEndDate" IS NOT NULL
      AND "BreakingEndDate" >= NOW()
      ORDER BY "PublishDate" DESC
      LIMIT 5
    `);

    const data = result.rows.length > 0
      ? result.rows.map((r: any) => r.Title)
      : [
          lang === 'mr'
            ? 'कोणत्याही ब्रेकिंग न्यूज नाहीत'
            : 'No breaking news available'
        ];

    return NextResponse.json({ status: 'OK', data });

  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message, data: [] });
  }
}