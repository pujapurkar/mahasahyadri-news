import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseGallery } from '@/lib/utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('q') || '';

    if (!keyword.trim()) {
      return NextResponse.json({ status: 'OK', data: [] });
    }

    const result = await query(`
      SELECT 
        NA."Id", NA."Title", NA."Content", NA."Author",
        NA."PublishDate", NA."Gallery",
        C."CategoryName" AS "Category"
      FROM "NewsArticles" NA
      LEFT JOIN "Categories" C ON NA."CategoryId" = C."CategoryId"
      WHERE NA."PublishDate" <= NOW()
      AND (
        NA."Title" ILIKE $1
        OR NA."Content" ILIKE $1
        OR NA."Author" ILIKE $1
        OR C."CategoryName" ILIKE $1
      )
      ORDER BY NA."PublishDate" DESC
      LIMIT 20
    `, [`%${keyword}%`]);

    const data = result.rows.map((r: any) => ({
      Id: r.Id,
      Title: r.Title,
      Content: r.Content,
      Category: r.Category || 'विविध',
      Author: r.Author,
      PublishDate: r.PublishDate,
      Gallery: parseGallery(r.Gallery),
      CommentCount: 0,
    }));

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message });
  }
}