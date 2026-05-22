import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseGallery, getRelativeTime, truncateText } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = (searchParams.get('lang') || 'mr') as 'mr' | 'en';
    const result = await query(`
      SELECT 
        NA."Id", NA."Title", NA."Content", NA."PublishDate",
        C."CategoryName", NA."Author", NA."Gallery"
      FROM "NewsArticles" NA
      LEFT JOIN "Categories" C ON NA."CategoryId" = C."CategoryId"
      WHERE NA."PublishDate" <= NOW()
      ORDER BY NA."PublishDate" DESC
      LIMIT 7
    `);
    const data = result.rows.map((r: any) => {
      const gallery = parseGallery(r.Gallery);

      const publishDate = new Date(r.PublishDate);
      return {
        Id: r.Id,
        Title: r.Title,
        Excerpt: truncateText(r.Content, 150),
        Category: r.CategoryName || 'विविध',
        Author: r.Author,
        TimeAgo: getRelativeTime(r.PublishDate, lang),
        HeroImage: gallery[0] || '/images/no-image.jpg',
      };
    });

    return NextResponse.json({ status: 'OK', data });
  } catch (e: any) {
    return NextResponse.json({ status: 'ERR', message: e.message, data: [] });
  }
}