import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { toMarathiDigits } from '@/lib/utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'mr';

    const result = await query(`
      SELECT "Id", "Title", COALESCE("ViewCount", 0) AS "ViewCount", "PublishDate"
      FROM "NewsArticles"
      WHERE COALESCE("ViewCount", 0) > 0
      AND "PublishDate" <= NOW()
      ORDER BY "ViewCount" DESC, "PublishDate" DESC
      LIMIT 5
    `);

    const data = result.rows.map((r: any) => ({
      Id: r.Id,
      Title: r.Title,
      SubTitle:
        lang === 'mr'
          ? toMarathiDigits(r.ViewCount.toString()) + ' वेळा पाहिले'
          : `Viewed ${r.ViewCount} times`,
      Url: `/news/${r.Id}`,
    }));

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message, data: [] });
  }
}